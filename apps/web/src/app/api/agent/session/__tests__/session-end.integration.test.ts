// Integration tests for POST /api/agent/session/end (T-035), against a
// local throwaway Postgres instance running the real migration files (see
// fixtures/local-postgres.ts — not a live Supabase project; see the PR
// description for the mocked-vs-live breakdown).
//
// Two of these tests are the explicit privacy/idempotency guarantees T-035
// exists to prove:
//   - "deletes the corresponding agent_conversation_turns rows" — the core
//     zero-retention guarantee ADR-001 D7 (amended) requires.
//   - "safe to call twice" — the idempotency requirement, verified by
//     asserting the second call returns byte-identical duration/cost
//     instead of drifting.

import type { Pool } from "pg";
import { Pool as PgPool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { handleEndSession } from "../end/handler";
import type { RouteDeps } from "../lib/deps";
import { createFakeTokenMinters } from "./fixtures/fake-token-minters";
import { startLocalPostgres, type LocalPostgres } from "./fixtures/local-postgres";
import { createPgAgentSessionsRepo } from "./fixtures/pg-repo";

function endRequest(body: unknown): Request {
  return new Request("http://localhost/api/agent/session/end", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/agent/session/end", () => {
  let pg: LocalPostgres;
  let pool: Pool;
  let deps: RouteDeps;
  let now: Date;

  beforeAll(async () => {
    pg = await startLocalPostgres();
    pool = new PgPool({ connectionString: pg.connectionString });
  }, 60_000);

  afterAll(async () => {
    await pool.end();
    pg.stop();
  });

  beforeEach(async () => {
    await pool.query("truncate agent_conversation_turns, agent_sessions restart identity cascade");
    now = new Date("2026-07-24T12:06:00.000Z");
    deps = {
      repo: createPgAgentSessionsRepo(pool),
      tokenMinters: createFakeTokenMinters(),
      clock: () => now,
    };
  });

  async function createSession(startedAt: Date, mode: "voice" | "text" = "voice") {
    const { rows } = await pool.query(
      `insert into agent_sessions (mode, started_at) values ($1, $2) returning id`,
      [mode, startedAt.toISOString()],
    );
    return rows[0].id as string;
  }

  async function insertTurns(sessionId: string, count: number) {
    for (let i = 0; i < count; i++) {
      await pool.query(
        `insert into agent_conversation_turns (session_id, turn_index, role, content) values ($1, $2, $3, $4)`,
        [sessionId, i, i % 2 === 0 ? "user" : "assistant", `turn ${i} content`],
      );
    }
  }

  it("deletes the corresponding agent_conversation_turns rows for the session (core privacy guarantee)", async () => {
    const started = new Date(now.getTime() - 3 * 60 * 1000);
    const sessionId = await createSession(started);
    await insertTurns(sessionId, 4);

    const { rows: before } = await pool.query(
      "select count(*)::int as count from agent_conversation_turns where session_id = $1",
      [sessionId],
    );
    expect(before[0].count).toBe(4);

    const res = await handleEndSession(deps, endRequest({ sessionId }));
    expect(res.status).toBe(200);

    const { rows: after } = await pool.query(
      "select count(*)::int as count from agent_conversation_turns where session_id = $1",
      [sessionId],
    );
    expect(after[0].count).toBe(0);
  });

  it("does not delete another session's conversation turns", async () => {
    const started = new Date(now.getTime() - 60_000);
    const sessionA = await createSession(started);
    const sessionB = await createSession(started);
    await insertTurns(sessionA, 2);
    await insertTurns(sessionB, 3);

    await handleEndSession(deps, endRequest({ sessionId: sessionA }));

    const { rows } = await pool.query(
      "select count(*)::int as count from agent_conversation_turns where session_id = $1",
      [sessionB],
    );
    expect(rows[0].count).toBe(3);
  });

  it("is safe to call twice: second call does not error and does not recompute duration/cost", async () => {
    const started = new Date(now.getTime() - 90_000); // 90s ago
    const sessionId = await createSession(started, "voice");
    await insertTurns(sessionId, 2);

    const first = await handleEndSession(deps, endRequest({ sessionId }));
    expect(first.status).toBe(200);
    const firstBody = await first.json();

    // Advance the clock, as a retry sent slightly later would.
    now = new Date(now.getTime() + 5_000);

    const second = await handleEndSession(deps, endRequest({ sessionId }));
    expect(second.status).toBe(200);
    const secondBody = await second.json();

    expect(secondBody).toEqual(firstBody); // byte-identical, no drift
    expect(secondBody.durationSeconds).toBe(90);

    // No duplicate row: still exactly one agent_sessions row for this id.
    const { rows } = await pool.query("select count(*)::int as count from agent_sessions where id = $1", [
      sessionId,
    ]);
    expect(rows[0].count).toBe(1);

    // The delete is idempotent too — re-running it after rows are already
    // gone doesn't error (implicitly proven by both calls above succeeding).
  });

  it("returns 404 for an unknown sessionId", async () => {
    const res = await handleEndSession(
      deps,
      endRequest({ sessionId: "00000000-0000-0000-0000-000000000000" }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 for a malformed sessionId", async () => {
    const res = await handleEndSession(deps, endRequest({ sessionId: "not-a-uuid" }));
    expect(res.status).toBe(400);
  });

  it("records duration, mode, cap-hit flag, and estimated cost; preserves server-tracked turn_count", async () => {
    const started = new Date(now.getTime() - 180_000); // 3 minutes ago
    const sessionId = await createSession(started, "voice");
    // Simulate /api/agent/turn (T-032, not part of this task) having already
    // incremented turn_count over the course of the conversation.
    await pool.query("update agent_sessions set turn_count = 7 where id = $1", [sessionId]);

    const res = await handleEndSession(
      deps,
      endRequest({ sessionId, capHit: true, capHitReason: "duration" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.durationSeconds).toBe(180);
    expect(body.mode).toBe("voice");
    expect(body.turnCount).toBe(7); // read from the row, not from the request
    expect(body.capHit).toBe(true);
    expect(body.capHitReason).toBe("duration");
    expect(body.estimatedCostUsd).toBeGreaterThan(0);
  });

  it("does not let a client unset a cap_hit the server already recorded", async () => {
    const started = new Date(now.getTime() - 60_000);
    const sessionId = await createSession(started);
    await pool.query(
      "update agent_sessions set cap_hit = true, cap_hit_reason = 'guardrail_escalation' where id = $1",
      [sessionId],
    );

    // Client reports nothing about caps at all.
    const res = await handleEndSession(deps, endRequest({ sessionId }));
    const body = await res.json();

    expect(body.capHit).toBe(true);
    expect(body.capHitReason).toBe("guardrail_escalation");
  });

  it("never returns conversation content — response is metadata-only", async () => {
    const started = new Date(now.getTime() - 30_000);
    const sessionId = await createSession(started);
    await insertTurns(sessionId, 3);

    const res = await handleEndSession(deps, endRequest({ sessionId }));
    const body = await res.json();

    const expectedKeys = [
      "sessionId",
      "mode",
      "startedAt",
      "endedAt",
      "durationSeconds",
      "turnCount",
      "capHit",
      "capHitReason",
      "estimatedCostUsd",
    ].sort();
    expect(Object.keys(body).sort()).toEqual(expectedKeys);

    const text = JSON.stringify(body);
    expect(text).not.toContain("turn 0 content");
    expect(text).not.toContain("content");
  });
});
