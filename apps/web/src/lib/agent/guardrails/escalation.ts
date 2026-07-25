// Conversation-level escalation on repeated violations (ADR-001 D8
// amended, control 4): "if the same session trips the classifier multiple
// times in a row..., the session should end early with the graceful
// wrap-up... rather than continuing to engage indefinitely with an
// adversarial user."
//
// No new database column exists for a running violation counter (and this
// task does not own packages/database/**, so it doesn't add one) —
// agent_sessions.turn_count/cap_hit_reason already anticipate this
// (cap_hit_reason's check constraint already includes
// 'guardrail_escalation', added by T-002 in anticipation of this task).
// Instead, /api/agent/turn re-derives the violation count each turn from
// the session's own conversation history (which it already loads every
// turn to build the prompt) by re-running the cheap pattern check against
// every past *user* turn, plus the current turn's verdict. This is pure,
// deterministic, and requires no schema change — see this module's
// counting function below and turn/handler.ts for how it's wired in.

const DEFAULT_ESCALATION_THRESHOLD = 3;

export interface EscalationCheckInput {
  /** Number of *prior* turns in this session that tripped either guardrail layer. */
  priorViolationCount: number;
  /** Whether the current turn also tripped a guardrail layer. */
  currentTurnViolated: boolean;
  threshold?: number;
}

export interface EscalationCheckResult {
  violationCount: number;
  shouldEscalate: boolean;
}

/**
 * Decides whether a session should end early with the graceful escalation
 * wrap-up, based on the running violation count. Threshold defaults to 3:
 * one or two adversarial probes get an in-character deflection and the
 * conversation continues (a visitor poking at the edges once or twice is
 * normal curiosity, not abuse); a third trips the escalation wrap-up
 * rather than engaging indefinitely.
 */
export function checkEscalation(input: EscalationCheckInput): EscalationCheckResult {
  const threshold = input.threshold ?? DEFAULT_ESCALATION_THRESHOLD;
  const violationCount = input.priorViolationCount + (input.currentTurnViolated ? 1 : 0);
  return {
    violationCount,
    shouldEscalate: violationCount >= threshold,
  };
}

export { DEFAULT_ESCALATION_THRESHOLD };
