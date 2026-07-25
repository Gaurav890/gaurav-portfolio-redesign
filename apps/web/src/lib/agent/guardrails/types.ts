// Shared types for the custom guardrail layer (T-034, ADR-001 D8 amended).
//
// This is the direct replacement for what ElevenLabs Guardrails 2.0 would
// have done natively — see the amendment banner in
// docs/30-engineering/ADR/001-web-stack-and-voice-agent-provider.md. There
// is zero vendor backing for any of this; every category below is a
// specific, deliberately-built control, not a system-prompt hope.

/** The five threat categories D8 (amended) lists explicitly, plus a clean pass. */
export type ViolationCategory =
  | "none"
  | "system_prompt_extraction"
  | "grounding_override"
  | "persona_break"
  | "off_topic_test"
  | "harmful_content";

export type GuardrailSource = "pattern" | "classifier";

export interface GuardrailVerdict {
  allowed: boolean;
  category: ViolationCategory;
  /** Which layer produced this verdict — useful for logging/tuning. */
  source: GuardrailSource;
  /** Short, non-sensitive reason string for observability (never logs user content verbatim beyond what's already in the turn). */
  reason: string;
}

export interface EscalationDecision {
  shouldEscalate: boolean;
  violationCount: number;
}
