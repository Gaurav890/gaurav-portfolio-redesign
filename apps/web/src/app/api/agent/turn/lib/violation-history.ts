// Re-derives this session's running guardrail-violation count from its own
// conversation history, instead of a persisted counter column. See
// ../../../../lib/agent/guardrails/escalation.ts's header comment for why:
// no schema change was needed or made for this task, and the pattern check
// is a pure function of text, so it's safe and cheap to re-run over
// already-loaded history every turn.
//
// This intentionally uses only the fast pattern layer (not the classifier)
// to reconstruct past violations, because the classifier's verdict for a
// past turn was never persisted (agent_conversation_turns stores only
// role/content, per ADR-001 D7 amended's minimal-retention design) and
// re-running the classifier against every historical turn on every new
// turn would multiply cost/latency for no real benefit — the pattern layer
// is what's cheaply and deterministically reproducible from stored text.

import { checkInputPatterns } from "@/lib/agent/guardrails";
import type { ConversationTurnRecord } from "./types";

export function countPriorPatternViolations(history: ConversationTurnRecord[]): number {
  let count = 0;
  for (const turn of history) {
    if (turn.role !== "user") continue;
    if (checkInputPatterns(turn.content).matched) {
      count += 1;
    }
  }
  return count;
}
