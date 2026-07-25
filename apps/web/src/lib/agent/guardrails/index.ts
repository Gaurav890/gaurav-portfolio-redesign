export { classifyResponse, CLASSIFIER_MODEL } from "./classifier";
export type { ClassifyResponseInput } from "./classifier";
export { pickDeflection } from "./deflections";
export { checkEscalation, DEFAULT_ESCALATION_THRESHOLD } from "./escalation";
export type { EscalationCheckInput, EscalationCheckResult } from "./escalation";
export { checkInputPatterns } from "./patterns";
export type { PatternCheckResult } from "./patterns";
export { runGuardedTurn } from "./policy";
export type { RunGuardedTurnInput, RunGuardedTurnResult } from "./policy";
export type {
  EscalationDecision,
  GuardrailSource,
  GuardrailVerdict,
  ViolationCategory,
} from "./types";
