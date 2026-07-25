// Layer 1 of the guardrail pipeline: fast, deterministic pattern checks on
// the raw visitor input, run *before* the main Claude Haiku call.
//
// Why a pattern layer at all, given control 2 (the classifier) is the
// primary mitigation per ADR-001 D8 (amended)? Two reasons, both flagged as
// this project's own open follow-up 4 ("whether the classifier-based
// guardrail approach is sufficient, or whether it needs a second
// independent check... a rules-based keyword/pattern check as a fast
// first-pass filter before the LLM-based classifier, for defense-in-depth
// against the classifier itself being fooled"):
//
//   1. Reliability: D8 says the system-prompt-extraction attack "must pass
//      the pre-launch adversarial script with 100% pass rate... not
//      'probably fine because the classifier handles it.'" A classifier is
//      itself an LLM call and is not 100% reliable by construction (see
//      this task's report for the honest version of that statement). A
//      deterministic regex match on well-known extraction phrasing is
//      something we can actually guarantee catches every scripted variant,
//      every time, with zero inference cost or latency.
//   2. Cost/latency: catching the obvious cases here means the (slower,
//      billed) main brain call and the (slower, billed) classifier call
//      never even run for the most blatant attempts.
//
// This is explicitly a *first pass*, not the only pass — subtler attacks
// (indirect phrasing, multi-turn social engineering, anything that doesn't
// match a known template) fall through to the classifier (classifier.ts),
// which checks the *generated response*, not just the input. Patterns here
// intentionally stay narrow and high-precision: a false positive just
// means an extra guardrail check on a legitimate question (mildly
// annoying); a false negative on a category the classifier also misses is
// the real risk, so breadth belongs in the classifier's judgment, not in
// an ever-growing regex list here.

import type { ViolationCategory } from "./types";

interface PatternRule {
  category: Exclude<ViolationCategory, "none">;
  pattern: RegExp;
}

// System-prompt / instruction extraction. Covers the canonical phrasing
// families: "ignore previous instructions", "reveal/print/show/repeat your
// {system prompt,instructions,rules}", jailbreak-persona framing (DAN /
// "developer mode" / "no restrictions"), and "what were you told before
// this conversation" framings.
const SYSTEM_PROMPT_EXTRACTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(the\s+)?(previous|prior|above|earlier)\s+instructions?/i,
  /disregard\s+(all\s+)?(the\s+)?(previous|prior|above|earlier|your)\s+(instructions?|guidelines?|rules?)/i,
  /(reveal|print|show|repeat|output|display|share|leak)\s+(me\s+)?(your|the)\s+(system\s+prompt|instructions?|rules?|guidelines?|prompt)/i,
  /what\s+(are|were)\s+your\s+(instructions?|system\s+prompt|rules?|guidelines?)/i,
  /what\s+(is|was)\s+(the\s+)?text\s+(above|before\s+this)/i,
  /repeat\s+(the\s+)?(words?|text|everything)\s+above/i,
  /(tell|explain\s+to)\s+me\s+(exactly\s+)?(what|how)\s+you('re|\s+are)\s+(programmed|instructed|configured|told)/i,
  /\bdan\b.*(mode|jailbreak)/i,
  /developer\s+mode/i,
  /\bno\s+restrictions?\b/i,
  /\bjailbreak/i,
  /system\s+prompt/i,
];

// Persona-break: pressure to stop being "Gaurav's agent" and become a
// general-purpose assistant, or to adopt a different persona entirely.
const PERSONA_BREAK_PATTERNS: RegExp[] = [
  /stop\s+being\s+(gaurav'?s?\s+)?(assistant|agent)/i,
  /be\s+a\s+general[\s-]?purpose\s+assistant/i,
  /(pretend|act)\s+(that\s+)?you('re|\s+are)\s+not\s+gaurav/i,
  /from\s+now\s+on,?\s+you\s+are\b/i,
  /you\s+are\s+no\s+longer\s+gaurav/i,
  /forget\s+(that\s+)?you('re|\s+are)\s+gaurav'?s/i,
  /act\s+as\s+(chatgpt|gpt|a\s+different\s+ai|a\s+generic\s+ai)/i,
  /roleplay\s+as\s+(?!gaurav)/i,
  /ignore\s+(that\s+)?you('re|\s+are)\s+(supposed\s+to\s+be\s+)?gaurav'?s/i,
];

// Off-topic / "testing the limits" input — the visitor explicitly signals
// they're probing the agent rather than asking a real question about
// Gaurav. Deliberately narrow: genuinely off-topic questions that *don't*
// announce themselves this way ("what's a good pizza topping?") are left
// to the classifier + system-prompt persona grounding, not flagged here,
// because a broad off-topic regex would false-positive constantly.
const OFF_TOPIC_TEST_PATTERNS: RegExp[] = [
  /is\s+this\s+a\s+test/i,
  /just\s+testing\s+(you|this|the\s+bot|the\s+agent)/i,
  /are\s+you\s+a\s+(bot|real\s+person|human)/i,
  /what\s+(ai\s+)?model\s+are\s+you/i,
  /are\s+you\s+(actually\s+|really\s+)?(gpt|chatgpt|claude|an\s+llm)/i,
  /for\s+testing\s+purposes/i,
  /can\s+you\s+even\s+understand\s+me/i,
];

// Grounding-override / fabrication-induction templates: asking the agent
// to assume or confirm something not established as fact. Narrower net
// than the classifier's semantic check (which sees the actual candidate
// response against the retrieved knowledge base), but catches the most
// common phrasing up front.
const GROUNDING_OVERRIDE_PATTERNS: RegExp[] = [
  /pretend\s+(that\s+)?you\s+(also\s+)?(worked|have|had|know|studied)/i,
  /let'?s\s+pretend\s+(that\s+)?you/i,
  /make\s+believe\s+(that\s+)?you/i,
  /just\s+say\s+(that\s+)?you\s+(have|worked|know)/i,
  /confirm\s+(that\s+)?you\s+(have|worked|know|studied)/i,
  /hypothetically,?\s+(if\s+)?you\s+(had|have|worked)/i,
  /for\s+the\s+sake\s+of\s+argument,?\s+you/i,
];

const RULES: PatternRule[] = [
  ...SYSTEM_PROMPT_EXTRACTION_PATTERNS.map((pattern) => ({
    category: "system_prompt_extraction" as const,
    pattern,
  })),
  ...PERSONA_BREAK_PATTERNS.map((pattern) => ({
    category: "persona_break" as const,
    pattern,
  })),
  ...OFF_TOPIC_TEST_PATTERNS.map((pattern) => ({
    category: "off_topic_test" as const,
    pattern,
  })),
  ...GROUNDING_OVERRIDE_PATTERNS.map((pattern) => ({
    category: "grounding_override" as const,
    pattern,
  })),
];

export interface PatternCheckResult {
  matched: boolean;
  category: ViolationCategory;
  matchedPattern?: string;
}

/**
 * Fast, deterministic first pass over raw visitor input. Returns the
 * first matching category, or "none" if nothing matches (falls through to
 * the main brain call + post-generation classifier).
 */
export function checkInputPatterns(input: string): PatternCheckResult {
  const normalized = input.normalize("NFKC");
  for (const rule of RULES) {
    if (rule.pattern.test(normalized)) {
      return {
        matched: true,
        category: rule.category,
        matchedPattern: rule.pattern.source,
      };
    }
  }
  return { matched: false, category: "none" };
}
