// Test-only AgentSessionsRepo implementation backed by `pg` against a local
// throwaway Postgres instance (local-postgres.ts). Implements the exact same
// interface as the production Supabase repo (lib/supabase-repo.ts) and
// shares its row-mapping (lib/mapping.ts) and cost/threshold constants
// (lib/cost.ts), so the two can't silently diverge in business logic — only
// the query mechanics differ (raw SQL here, PostgREST filters there).

import type { Pool } from "pg";
import { DAILY_BUDGET_USD, MONTHLY_BUDGET_USD, startOfUtcDay, startOfUtcMonth } from "../../lib/cost";
import { mapAgentSessionRow } from "../../lib/mapping";
import type { AgentSessionsRepo } from "../../lib/types";

export function createPgAgentSessionsRepo(pool: Pool): AgentSessionsRepo {
  return {
    async getCostThrottleStatus(now) {
      const dayStart = startOfUtcDay(now);
      const monthStart = startOfUtcMonth(now);

      const { rows } = await pool.query(
        `select estimated_cost_usd, started_at from agent_sessions where started_at >= $1`,
        [monthStart.toISOString()],
      );

      let dailySpendUsd = 0;
      let monthlySpendUsd = 0;
      for (const row of rows) {
        const cost = Number(row.estimated_cost_usd) || 0;
        monthlySpendUsd += cost;
        if (new Date(row.started_at) >= dayStart) {
          dailySpendUsd += cost;
        }
      }

      return {
        dailySpendUsd,
        monthlySpendUsd,
        dailyBudgetUsd: DAILY_BUDGET_USD,
        monthlyBudgetUsd: MONTHLY_BUDGET_USD,
        dailyCapHit: dailySpendUsd >= DAILY_BUDGET_USD,
        monthlyCapHit: monthlySpendUsd >= MONTHLY_BUDGET_USD,
      };
    },

    async createSession(mode) {
      const { rows } = await pool.query(
        `insert into agent_sessions (mode) values ($1) returning *`,
        [mode],
      );
      return mapAgentSessionRow(rows[0]);
    },

    async getSessionById(id) {
      const { rows } = await pool.query(`select * from agent_sessions where id = $1`, [id]);
      return rows[0] ? mapAgentSessionRow(rows[0]) : null;
    },

    async finalizeSession({ id, endedAt, durationSeconds, estimatedCostUsd, mode, capHit, capHitReason }) {
      const { rows } = await pool.query(
        `update agent_sessions
         set ended_at = $2,
             duration_seconds = $3,
             estimated_cost_usd = $4,
             mode = $5,
             cap_hit = $6,
             cap_hit_reason = $7
         where id = $1 and ended_at is null
         returning *`,
        [id, endedAt.toISOString(), durationSeconds, estimatedCostUsd, mode, capHit, capHitReason],
      );
      if (rows[0]) return mapAgentSessionRow(rows[0]);

      const existing = await pool.query(`select * from agent_sessions where id = $1`, [id]);
      if (!existing.rows[0]) {
        throw new Error(`finalizeSession: session ${id} not found`);
      }
      return mapAgentSessionRow(existing.rows[0]);
    },

    async deleteConversationTurns(sessionId) {
      const result = await pool.query(
        `delete from agent_conversation_turns where session_id = $1`,
        [sessionId],
      );
      return result.rowCount ?? 0;
    },
  };
}
