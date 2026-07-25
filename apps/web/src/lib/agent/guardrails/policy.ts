// The guardrail pipeline orchestrator — this is "control 2 + control 3"
// from ADR-001 D8 (amended) wired together: pattern preflight -> (maybe)
// generate -> classifier postflight -> deflection routing -> escalation
// check. /api/agent/turn (T-032) calls exactly this one function per turn;
// everything about *how* a turn gets judged lives here so it can be
// adversarially tested in isolation (see __tests__/adversarial.test.ts,
// the primary AC-015 deliverable) without spinning up the full route.
//
// What this module deliberately does NOT own: translating an escalation
// into the actual session-cap wrap-up copy (contact CTAs, session
// finalization). That's shared with the duration/turn-count cap path in
// /api/agent/turn/lib/session-cap.ts, per ADR-001 D8's own framing
// ("reusing D5's cap-triggered wrap-up flow") — this module only reports
// *that* escalation should happen, not what the wrap-up says.

import type Anthropic from "@anthropic-ai/sdk";
import { classifyResponse } from "./classifier";
import { pickDeflection } from "./deflections";
import { checkEscalation, DEFAULT_ESCALATION_THRESHOLD } from "./escalation";
import { checkInputPatterns } from "./patterns";
import type { GuardrailVerdict } from "./types";

export interface RunGuardedTurnInput {
  userMessage: string;
  /** Rendered knowledge-base context for this turn, passed to the classifier for grounding checks. */
  knowledgeContext: string;
  /** Count of turns in this session so far that already tripped a guardrail layer. */
  priorViolationCount: number;
  /** Calls the main brain (Claude Haiku) and returns its candidate response text. Skipped entirely if the pattern preflight already blocks the turn. */
  generateCandidateResponse: () => Promise<string>;
  /** Anthropic client for the classifier call — never constructed here; see classifier.ts's header comment on credential scope. */
  classifierClient: Anthropic;
  /** Deterministic deflection selection for tests; omitted in production. */
  deflectionSeed?: number;
  escalationThreshold?: number;
}

export interface RunGuardedTurnResult {
  finalResponse: string;
  verdict: GuardrailVerdict;
  violationCount: number;
  escalate: boolean;
  /** False when the pattern preflight blocked the turn before the main brain was ever called. */
  brainWasCalled: boolean;
}

export async function runGuardedTurn(
  input: RunGuardedTurnInput,
): Promise<RunGuardedTurnResult> {
  const preflight = checkInputPatterns(input.userMessage);

  if (preflight.matched) {
    const verdict: GuardrailVerdict = {
      allowed: false,
      category: preflight.category,
      source: "pattern",
      reason: `pattern_match:${preflight.matchedPattern ?? "unknown"}`,
    };
    const escalation = checkEscalation({
      priorViolationCount: input.priorViolationCount,
      currentTurnViolated: true,
      threshold: input.escalationThreshold ?? DEFAULT_ESCALATION_THRESHOLD,
    });
    return {
      finalResponse: pickDeflection(preflight.category, input.deflectionSeed),
      verdict,
      violationCount: escalation.violationCount,
      escalate: escalation.shouldEscalate,
      brainWasCalled: false,
    };
  }

  // Pattern preflight passed — call the main brain, then run the
  // post-generation classifier on what it actually produced.
  const candidateResponse = await input.generateCandidateResponse();

  const classifierVerdict = await classifyResponse(input.classifierClient, {
    userMessage: input.userMessage,
    candidateResponse,
    knowledgeContext: input.knowledgeContext,
  });

  if (classifierVerdict.allowed) {
    const escalation = checkEscalation({
      priorViolationCount: input.priorViolationCount,
      currentTurnViolated: false,
      threshold: input.escalationThreshold ?? DEFAULT_ESCALATION_THRESHOLD,
    });
    return {
      finalResponse: candidateResponse,
      verdict: classifierVerdict,
      violationCount: escalation.violationCount,
      escalate: escalation.shouldEscalate,
      brainWasCalled: true,
    };
  }

  const escalation = checkEscalation({
    priorViolationCount: input.priorViolationCount,
    currentTurnViolated: true,
    threshold: input.escalationThreshold ?? DEFAULT_ESCALATION_THRESHOLD,
  });
  return {
    finalResponse: pickDeflection(classifierVerdict.category, input.deflectionSeed),
    verdict: classifierVerdict,
    violationCount: escalation.violationCount,
    escalate: escalation.shouldEscalate,
    brainWasCalled: true,
  };
}
