// Production AgentSessionsRepo, backed by @supabase/supabase-js against the
// agent_sessions / agent_conversation_turns tables (packages/database/supabase/migrations/,
// docs/30-engineering/DATA_MODEL.md). Uses the service-role client only —
// this repo is never constructed with the anon key (see lib/deps.ts).
//
// Not verified against a live Supabase project in this environment (no
// credentials) — verified via an equivalent, Postgres-backed test double
// (__tests__/fixtures/pg-repo.ts) against a local throwaway Postgres
// instance running the real migration files, per .claude/rules/testing.md.
// Both implementations share `mapAgentSessionRow` (lib/mapping.ts) and the
// cost/threshold constants (lib/cost.ts) so the two can't silently diverge
// on row-shaping or budget math, even though the query mechanics (PostgREST
// filters vs. raw SQL) differ.

import type { SupabaseClient } from "@supabase/supabase-js";
import { DAILY_BUDGET_USD, MONTHLY_BUDGET_USD, startOfUtcDay, startOfUtcMonth } from "./cost";
import { mapAgentSessionRow } from "./mapping";
import type { AgentSessionsRepo } from "./types";

const AGENT_SESSIONS_TABLE = "agent_sessions";
const AGENT_CONVERSATION_TURNS_TABLE = "agent_conversation_turns";

export function createSupabaseAgentSessionsRepo(
  client: SupabaseClient,
): AgentSessionsRepo {
  return {
    async getCostThrottleStatus(now) {
      const dayStart = startOfUtcDay(now);
      const monthStart = startOfUtcMonth(now);

      // One round trip: the month window is a superset of the day window,
      // so fetch rows since month-start once and bucket them in memory.
      // Uses idx_agent_sessions_started_at (DATA_MODEL.md "Indexes").
      const { data, error } = await client
        .from(AGENT_SESSIONS_TABLE)
        .select("estimated_cost_usd, started_at")
        .gte("started_at", monthStart.toISOString());

      if (error) {
        throw new Error(`getCostThrottleStatus query failed: ${error.message}`);
      }

      let dailySpendUsd = 0;
      let monthlySpendUsd = 0;
      for (const row of data ?? []) {
        const cost = Number(row.estimated_cost_usd) || 0;
        monthlySpendUsd += cost;
        if (new Date(row.started_at as string) >= dayStart) {
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
      const { data, error } = await client
        .from(AGENT_SESSIONS_TABLE)
        .insert({ mode })
        .select()
        .single();

      if (error || !data) {
        throw new Error(`createSession insert failed: ${error?.message ?? "no row returned"}`);
      }
      return mapAgentSessionRow(data);
    },

    async getSessionById(id) {
      const { data, error } = await client
        .from(AGENT_SESSIONS_TABLE)
        .select()
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new Error(`getSessionById query failed: ${error.message}`);
      }
      return data ? mapAgentSessionRow(data) : null;
    },

    async finalizeSession({ id, endedAt, durationSeconds, estimatedCostUsd, mode, capHit, capHitReason }) {
      // Guarded update: only writes if the session hasn't already been
      // finalized (ended_at IS NULL). If a prior call already finalized it
      // (client retry), this matches zero rows and we fall through to
      // re-fetching the existing, already-correct row below — that's the
      // idempotency contract T-035 requires.
      const { data, error } = await client
        .from(AGENT_SESSIONS_TABLE)
        .update({
          ended_at: endedAt.toISOString(),
          duration_seconds: durationSeconds,
          estimated_cost_usd: estimatedCostUsd,
          mode,
          cap_hit: capHit,
          cap_hit_reason: capHitReason,
        })
        .eq("id", id)
        .is("ended_at", null)
        .select()
        .maybeSingle();

      if (error) {
        throw new Error(`finalizeSession update failed: ${error.message}`);
      }
      if (data) {
        return mapAgentSessionRow(data);
      }

      const { data: existing, error: fetchError } = await client
        .from(AGENT_SESSIONS_TABLE)
        .select()
        .eq("id", id)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`finalizeSession refetch failed: ${fetchError.message}`);
      }
      if (!existing) {
        throw new Error(`finalizeSession: session ${id} not found`);
      }
      return mapAgentSessionRow(existing);
    },

    async deleteConversationTurns(sessionId) {
      const { error, count } = await client
        .from(AGENT_CONVERSATION_TURNS_TABLE)
        .delete({ count: "exact" })
        .eq("session_id", sessionId);

      if (error) {
        throw new Error(`deleteConversationTurns failed: ${error.message}`);
      }
      return count ?? 0;
    },
  };
}
