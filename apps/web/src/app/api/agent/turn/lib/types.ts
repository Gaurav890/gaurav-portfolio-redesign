// Shared types for POST /api/agent/turn (T-032). Kept local to this route
// tree, same rationale as ../session/lib/types.ts documents for its own
// scope: this task's files_owned boundary is this directory only.

export type AgentMode = "voice" | "text";
export type TurnRole = "user" | "assistant";

/** The subset of agent_sessions this route needs — never the full row, and never conversation content (that's a different table). */
export interface AgentSessionSnapshot {
  id: string;
  mode: AgentMode;
  startedAt: string; // ISO 8601
  endedAt: string | null;
  turnCount: number;
}

export interface ConversationTurnRecord {
  turnIndex: number;
  role: TurnRole;
  content: string;
}

/**
 * Data-access boundary for this route. One production implementation
 * (Supabase) and one Postgres-backed test double, mirroring the pattern in
 * ../../session/lib/types.ts and __tests__/fixtures/pg-repo.ts, but
 * implemented independently in this directory (not imported across the
 * route-tree boundary — see lib/http.ts's header comment for why).
 */
export interface TurnRepo {
  getSessionById(id: string): Promise<AgentSessionSnapshot | null>;

  /** Full conversation history for this session, in turn_index order. */
  listConversationTurns(sessionId: string): Promise<ConversationTurnRecord[]>;

  /**
   * Appends the user turn and the (guardrail-approved, possibly
   * cap-reframed) assistant turn for one exchange, and increments
   * agent_sessions.turn_count by exactly 1 — "one user turn" per ADR-001
   * D5 (amended)'s 20-turn cap, regardless of how many assistant content
   * blocks/rows that turn happens to produce. Returns the session's new
   * turn_count so the caller can log/report it without a second read.
   */
  appendExchange(params: {
    sessionId: string;
    nextTurnIndexStart: number;
    userContent: string;
    assistantContent: string;
    /**
     * The turn_count this repo read at the start of the request — used as
     * a compare-and-swap guard on the increment (mirrors the
     * ended_at-guarded update pattern in ../../session/lib/supabase-repo.ts)
     * so two concurrent requests for the same session can't silently race
     * and under-count. A mismatch throws rather than double-writing.
     */
    expectedCurrentTurnCount: number;
  }): Promise<{ turnCount: number }>;
}
