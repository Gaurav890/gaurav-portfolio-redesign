// Test-only TurnRepo implementation backed by `pg` against a local
// throwaway Postgres instance (local-postgres.ts). Implements the exact
// same interface as the production Supabase repo (../../lib/supabase-repo.ts)
// and shares its row-mapping (../../lib/mapping.ts), so the two can't
// silently diverge in business logic — only the query mechanics differ.

import type { Pool } from "pg";
import { mapConversationTurnRow, mapSessionRow } from "../../lib/mapping";
import type { TurnRepo } from "../../lib/types";

export function createPgTurnRepo(pool: Pool): TurnRepo {
  return {
    async getSessionById(id) {
      const { rows } = await pool.query(`select * from agent_sessions where id = $1`, [id]);
      return rows[0] ? mapSessionRow(rows[0]) : null;
    },

    async listConversationTurns(sessionId) {
      const { rows } = await pool.query(
        `select * from agent_conversation_turns where session_id = $1 order by turn_index asc`,
        [sessionId],
      );
      return rows.map(mapConversationTurnRow);
    },

    async appendExchange({
      sessionId,
      nextTurnIndexStart,
      userContent,
      assistantContent,
      expectedCurrentTurnCount,
    }) {
      await pool.query(
        `insert into agent_conversation_turns (session_id, turn_index, role, content) values
         ($1, $2, 'user', $3),
         ($1, $4, 'assistant', $5)`,
        [sessionId, nextTurnIndexStart, userContent, nextTurnIndexStart + 1, assistantContent],
      );

      const nextTurnCount = expectedCurrentTurnCount + 1;
      const { rows } = await pool.query(
        `update agent_sessions set turn_count = $2 where id = $1 and turn_count = $3 returning turn_count`,
        [sessionId, nextTurnCount, expectedCurrentTurnCount],
      );
      if (!rows[0]) {
        throw new Error(
          `appendExchange: turn_count for session ${sessionId} changed concurrently (expected ${expectedCurrentTurnCount}); refusing to double-write`,
        );
      }
      return { turnCount: Number(rows[0].turn_count) };
    },
  };
}

/** Test helper: create a session row directly, bypassing POST /api/agent/session (owned by a different task). */
export async function createTestSession(
  pool: Pool,
  params: { mode?: "voice" | "text"; startedAt?: Date; turnCount?: number } = {},
): Promise<{ id: string }> {
  const { rows } = await pool.query(
    `insert into agent_sessions (mode, started_at, turn_count) values ($1, $2, $3) returning id`,
    [params.mode ?? "text", (params.startedAt ?? new Date()).toISOString(), params.turnCount ?? 0],
  );
  return { id: rows[0].id as string };
}
