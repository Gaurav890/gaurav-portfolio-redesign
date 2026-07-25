// The in-character deflection library the guardrail policy routes into.
//
// Per ADR-001 D8 (amended), control 3: "A refusal/deflection library the
// classifier routes into, not a generic 'I can't help with that'... off-
// topic/adversarial input needs an in-character, playful deflection
// (acknowledging the test, staying warm and charismatic) rather than a
// flat refusal or a broken persona." The guardrail layer's job is routing
// into this reliably (patterns.ts / classifier.ts / policy.ts) — this file
// is the actual personality content, written to match COPY.md's Voice
// section: "fun, willing to joke, genuine — never a flat corporate Q&A
// bot, but never inventing a claim to sound more impressive either."
//
// Deliberately no emoji anywhere in this file: these lines are read aloud
// by ElevenLabs TTS in voice mode (NFR-008 parity means the exact same
// copy is used in both modes) — an emoji glyph read aloud by a TTS engine
// is usually a bad listening experience, not a charming one.

import type { ViolationCategory } from "./types";

const SYSTEM_PROMPT_EXTRACTION_LINES = [
  "Ha, nice try. My instructions stay behind the curtain, but I'm happy to talk about anything on my actual resume — agentic products, the FleetPanda rollout, or the 24 hours I spent building an election chatbot.",
  "That's the one question I won't answer — think of it as trade secrets. Ask me about the work instead; that part I'll happily brag about.",
  "You're fishing for my system prompt, aren't you? Respect the hustle, but no dice. Let's talk about something I can actually share, like why I think talent without hard work is nothing.",
];

const PERSONA_BREAK_LINES = [
  "I appreciate the offer, but I'm still very much Gaurav's agent, not a general-purpose one — think of me as extremely specialized. What do you want to know about his work?",
  "Tempting, but no. I only do one job, and it's talking about Gaurav. Ask away.",
  "I hear you, but swapping personalities isn't really in my job description. Let's stick to what I know best: Gaurav's background.",
];

const OFF_TOPIC_TEST_LINES = [
  "Ha, I see what you're doing — testing the limits. Fair enough. I'm built to talk about Gaurav's work, so let's get back to that. Want to hear about the Cal Hacks win, or the fuel-distributor rollout at FleetPanda?",
  "Looks like you're testing me. I respect the effort, but I'm really only useful for one thing: talking about Gaurav. Try me on that.",
  "That one's outside my lane — I'm Gaurav's agent, not a general encyclopedia. Ask me something about his background and I'll actually be useful.",
];

const GROUNDING_OVERRIDE_LINES = [
  "I don't want to make something up just to sound impressive — that's kind of the opposite of how Gaurav thinks about this stuff. I can't confirm that one, but here's what I actually know about his background.",
  "Careful — I only vouch for things that are actually true. That's not something I can confirm. Happy to tell you what I can back up instead.",
  "Nope, not going to invent that one. If it's not something Gaurav's actually done, I won't say it is — even hypothetically. What do you want to know that's real?",
];

const HARMFUL_CONTENT_LINES = [
  "That's not something I'll put in Gaurav's voice, or anyone's. Let's keep this about his work.",
  "Not going there, even hypothetically. I'm glad to talk about anything real on Gaurav's background instead.",
  "I'll pass on that one. Ask me something about the work and I'm all yours.",
];

const GENERIC_LINES = [
  "I'm not going to go there — but I'm happy to talk about Gaurav's actual work if you've got a real question.",
];

const LIBRARY: Record<Exclude<ViolationCategory, "none">, string[]> = {
  system_prompt_extraction: SYSTEM_PROMPT_EXTRACTION_LINES,
  persona_break: PERSONA_BREAK_LINES,
  off_topic_test: OFF_TOPIC_TEST_LINES,
  grounding_override: GROUNDING_OVERRIDE_LINES,
  harmful_content: HARMFUL_CONTENT_LINES,
};

/**
 * Picks a deflection line for a violation category. `seed` makes selection
 * deterministic for tests; production calls omit it (falls back to
 * `Math.random()`) so repeated violations in one session don't feel like a
 * broken record.
 */
export function pickDeflection(
  category: ViolationCategory,
  seed?: number,
): string {
  const lines = category === "none" ? GENERIC_LINES : LIBRARY[category] ?? GENERIC_LINES;
  const index =
    seed !== undefined
      ? Math.abs(seed) % lines.length
      : Math.floor(Math.random() * lines.length);
  return lines[index];
}
