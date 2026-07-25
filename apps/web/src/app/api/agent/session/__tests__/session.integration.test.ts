// Integration tests for POST /api/agent/session (T-031), verified per
// .claude/rules/testing.md as:
//   - real business logic (throttle math, mode decisions, idempotent
//     writes) against a local, throwaway Postgres instance running the
//     actual migration files — NOT a live Supabase project;
//   - mocked Deepgram/ElevenLabs token-mint calls — NOT live provider APIs.
// See the PR description for the full mocked-vs-live breakdown.

import type { Pool } from "pg";
import { Pool as PgPool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { handleCreateSession } from "../handler";
import type { RouteDeps } from "../lib/deps";
import { createFailingTokenMinter, createFakeTokenMinters } from "./fixtures/fake-token-minters";
import { startLocalPostgres, type LocalPostgres } from "./fixtures/local-postgres";
import { createPgAgentSessionsRepo } from "./fixtures/pg-repo";

const FIXED_NOW = new Date("2026-07-24T12:00:00.000Z");

function request(body: unknown): Request {
  return new Request("http://localhost/api/agent/session", {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

async function seedSpend(pool: Pool, entries: { costUsd: number; startedAt: Date; mode?: "voice" | "text" }[]) {
  for (const entry of entries) {
    await pool.query(
      `insert into agent_sessions (mode, started_at, estimated_cost_usd) values ($1, $2, $3)`,
      [entry.mode ?? "voice", entry.startedAt.toISOString(), entry.costUsd],
    );
  }
}

describe("POST /api/agent/session", () => {
  let pg: LocalPostgres;
  let pool: Pool;
  let deps: RouteDeps;

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
    deps = {
      repo: createPgAgentSessionsRepo(pool),
      tokenMinters: createFakeTokenMinters(),
      clock: () => FIXED_NOW,
    };
  });

  it("under-budget request mints both Deepgram and ElevenLabs tokens and creates a voice session", async () => {
    const res = await handleCreateSession(deps, request({ mode: "voice" }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.mode).toBe("voice");
    expect(body.degraded).toBe(false);
    expect(body.deepgram).toEqual({ token: "fake-deepgram-token", expiresInSeconds: 30 });
    expect(body.elevenLabs).toEqual({ token: "fake-elevenlabs-token", expiresInSeconds: 900 });
    expect(body.sessionId).toBeTruthy();

    const { rows } = await pool.query("select mode from agent_sessions where id = $1", [body.sessionId]);
    expect(rows[0].mode).toBe("voice");
  });

  it("defaults to voice mode when no body is sent", async () => {
    const res = await handleCreateSession(deps, request(undefined));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mode).toBe("voice");
  });

  it("a voluntary text-mode request under budget skips minting entirely", async () => {
    const mintDeepgramToken = vi.fn(createFakeTokenMinters().mintDeepgramToken);
    const mintElevenLabsToken = vi.fn(createFakeTokenMinters().mintElevenLabsToken);
    deps.tokenMinters = { mintDeepgramToken, mintElevenLabsToken };

    const res = await handleCreateSession(deps, request({ mode: "text" }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.mode).toBe("text");
    expect(body.degraded).toBe(false);
    expect(body.deepgram).toBeUndefined();
    expect(body.elevenLabs).toBeUndefined();
    expect(mintDeepgramToken).not.toHaveBeenCalled();
    expect(mintElevenLabsToken).not.toHaveBeenCalled();
  });

  it("daily cap hit creates a text-only session and does NOT refuse the request", async () => {
    // $5/day budget: seed exactly at the threshold with sessions started today.
    await seedSpend(pool, [
      { costUsd: 2.5, startedAt: FIXED_NOW },
      { costUsd: 2.5, startedAt: FIXED_NOW },
    ]);

    const mintDeepgramToken = vi.fn(createFakeTokenMinters().mintDeepgramToken);
    const mintElevenLabsToken = vi.fn(createFakeTokenMinters().mintElevenLabsToken);
    deps.tokenMinters = { mintDeepgramToken, mintElevenLabsToken };

    const res = await handleCreateSession(deps, request({ mode: "voice" }));

    expect(res.status).toBe(200); // never a refusal
    const body = await res.json();
    expect(body.mode).toBe("text");
    expect(body.degraded).toBe(true);
    expect(body.degradedReason).toBe("daily_cost_ceiling");
    expect(body.deepgram).toBeUndefined();
    expect(body.elevenLabs).toBeUndefined();
    expect(mintDeepgramToken).not.toHaveBeenCalled();
    expect(mintElevenLabsToken).not.toHaveBeenCalled();

    const { rows } = await pool.query("select mode from agent_sessions where id = $1", [body.sessionId]);
    expect(rows[0].mode).toBe("text");
  });

  it("spend from a previous day does not count toward today's daily cap", async () => {
    // $6 would trip the $5 daily cap if it counted for "today", but stays
    // well under the $60 monthly cap either way — isolates the day-boundary
    // behavior from the separate monthly-ceiling check.
    const yesterday = new Date(FIXED_NOW.getTime() - 24 * 60 * 60 * 1000);
    await seedSpend(pool, [{ costUsd: 6, startedAt: yesterday }]);

    const res = await handleCreateSession(deps, request({ mode: "voice" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mode).toBe("voice");
    expect(body.degraded).toBe(false);
  });

  it("monthly cap hit refuses the request outright and creates no session", async () => {
    await seedSpend(pool, [{ costUsd: 60, startedAt: FIXED_NOW }]);

    const mintDeepgramToken = vi.fn(createFakeTokenMinters().mintDeepgramToken);
    const mintElevenLabsToken = vi.fn(createFakeTokenMinters().mintElevenLabsToken);
    deps.tokenMinters = { mintDeepgramToken, mintElevenLabsToken };

    const { rows: before } = await pool.query("select count(*)::int as count from agent_sessions");

    const res = await handleCreateSession(deps, request({ mode: "voice" }));

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("temporarily_unavailable");
    expect(body.reason).toBe("monthly_cost_ceiling");
    expect(mintDeepgramToken).not.toHaveBeenCalled();
    expect(mintElevenLabsToken).not.toHaveBeenCalled();

    const { rows: after } = await pool.query("select count(*)::int as count from agent_sessions");
    expect(after[0].count).toBe(before[0].count); // no session row created
  });

  it("monthly cap takes priority over the daily-cap graceful-degradation path", async () => {
    await seedSpend(pool, [{ costUsd: 60, startedAt: FIXED_NOW }]); // also hits the daily cap
    const res = await handleCreateSession(deps, request({ mode: "voice" }));
    expect(res.status).toBe(503); // refused, not degraded to text
  });

  it("gracefully degrades to text-only if token minting fails, without failing the request", async () => {
    deps.tokenMinters = createFakeTokenMinters({
      mintDeepgramToken: createFakeTokenMinters().mintDeepgramToken,
      mintElevenLabsToken: createFailingTokenMinter("ElevenLabs unreachable (simulated)"),
    });

    const res = await handleCreateSession(deps, request({ mode: "voice" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mode).toBe("text");
    expect(body.degraded).toBe(true);
    expect(body.degradedReason).toBe("voice_unavailable");

    const { rows } = await pool.query("select mode from agent_sessions where id = $1", [body.sessionId]);
    expect(rows[0].mode).toBe("text");
  });

  it("rejects an invalid mode with 400 and creates no session", async () => {
    const { rows: before } = await pool.query("select count(*)::int as count from agent_sessions");
    const res = await handleCreateSession(deps, request({ mode: "carrier-pigeon" }));
    expect(res.status).toBe(400);
    const { rows: after } = await pool.query("select count(*)::int as count from agent_sessions");
    expect(after[0].count).toBe(before[0].count);
  });

  it("rejects invalid JSON with 400", async () => {
    const badRequest = new Request("http://localhost/api/agent/session", {
      method: "POST",
      body: "{not json",
      headers: { "content-type": "application/json" },
    });
    const res = await handleCreateSession(deps, badRequest);
    expect(res.status).toBe(400);
  });

  it("never includes ANTHROPIC_API_KEY-shaped data anywhere in the response", async () => {
    const res = await handleCreateSession(deps, request({ mode: "voice" }));
    const text = await res.text();
    expect(text.toLowerCase()).not.toContain("anthropic");
  });
});
