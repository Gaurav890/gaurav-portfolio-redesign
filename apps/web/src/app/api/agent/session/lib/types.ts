// Shared types for /api/agent/session (T-031) and /api/agent/session/end
// (T-035). Kept local to this route tree (apps/web/src/app/api/agent/session/**)
// rather than a shared apps/web/src/lib/agent/** module, since no other task
// currently owns that path and this task's files_owned scope is limited to
// this directory — see the PR description for the file-ownership rationale.
// T-032 (/api/agent/turn) and T-036 (cost-throttle module) may extract a
// shared version of this once they exist; that's a deliberate future
// consolidation, not an oversight.

export type AgentMode = "voice" | "text";

// Mirrors the check constraint on agent_sessions.cap_hit_reason in
// packages/database/supabase/migrations/20260724120100_agent_sessions.sql.
export type CapHitReason =
  | "duration"
  | "turn_count"
  | "monthly_ceiling"
  | "guardrail_escalation";

// Camel-cased mirror of the agent_sessions row shape in
// docs/30-engineering/DATA_MODEL.md. Never carries conversation content —
// that lives only in agent_conversation_turns, a different table with
// different retention rules (ADR-001 D7, amended).
export interface AgentSessionRecord {
  id: string;
  mode: AgentMode;
  startedAt: string; // ISO 8601
  endedAt: string | null;
  durationSeconds: number | null;
  turnCount: number;
  capHit: boolean;
  capHitReason: CapHitReason | null;
  estimatedCostUsd: number;
  createdAt: string;
}

export interface CostThrottleStatus {
  dailySpendUsd: number;
  monthlySpendUsd: number;
  dailyBudgetUsd: number;
  monthlyBudgetUsd: number;
  dailyCapHit: boolean;
  monthlyCapHit: boolean;
}

// Data-access boundary for both route handlers in this tree. Two
// implementations exist: `createSupabaseAgentSessionsRepo` (production,
// backed by @supabase/supabase-js) and a Postgres-backed test double
// (`__tests__/fixtures/pg-repo.ts`, backed by `pg` against a local throwaway
// Postgres instance) used to verify the actual SQL-shaped business logic
// without live Supabase credentials, per .claude/rules/testing.md.
export interface AgentSessionsRepo {
  /**
   * Sums agent_sessions.estimated_cost_usd for sessions started today (UTC)
   * and this month (UTC) — the query ADR-001 D6 (amended) and
   * idx_agent_sessions_started_at exist to support. `now` is injected for
   * deterministic testing.
   */
  getCostThrottleStatus(now: Date): Promise<CostThrottleStatus>;

  createSession(mode: AgentMode): Promise<AgentSessionRecord>;

  getSessionById(id: string): Promise<AgentSessionRecord | null>;

  /**
   * Finalizes a session at end-of-life. Guarded so it only writes when
   * `ended_at IS NULL` (race-safe first-finalize); if the row was already
   * finalized by a prior call, implementations must return the existing row
   * unchanged rather than erroring or re-writing (T-035's idempotency
   * requirement). All fields are the handler's already-resolved final
   * values — the repo does not merge with existing state itself.
   */
  finalizeSession(params: {
    id: string;
    endedAt: Date;
    durationSeconds: number;
    estimatedCostUsd: number;
    mode: AgentMode;
    capHit: boolean;
    capHitReason: CapHitReason | null;
  }): Promise<AgentSessionRecord>;

  /**
   * The primary deletion guarantee for ADR-001 D7 (amended) — explicit
   * DELETE of this session's transient conversation history. Returns the
   * number of rows deleted (0 on a retry once already deleted — idempotent
   * by construction).
   */
  deleteConversationTurns(sessionId: string): Promise<number>;
}

export interface MintedToken {
  token: string;
  expiresInSeconds: number;
}

// Injectable so tests can supply fakes instead of calling the real Deepgram/
// ElevenLabs APIs (no live credentials in this environment — see
// .claude/rules/testing.md on distinguishing mocked from live evidence).
export interface TokenMinters {
  mintDeepgramToken(): Promise<MintedToken>;
  mintElevenLabsToken(): Promise<MintedToken>;
}
