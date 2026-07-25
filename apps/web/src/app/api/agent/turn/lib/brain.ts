// The main "brain" call — Claude Haiku via the Anthropic Messages API
// (ADR-001 D2 amended: "Claude Haiku, called directly via the Anthropic
// Messages API from our own backend"). Uses the SDK's streaming helper
// internally (per this project's claude-api skill guidance: "default to
// streaming for any request that may involve long input, long output, or
// high max_tokens") so a slow generation can't hit an HTTP timeout — but
// the full text is accumulated server-side before this function returns,
// not forwarded token-by-token to the browser.
//
// That's a deliberate consequence of ADR-001 D8 (amended)'s architecture,
// not an oversight: "run a second... LLM call that checks the candidate
// response... before it's streamed to the browser." The guardrail
// classifier needs to see the *complete* candidate response to judge
// grounding/persona/safety, so nothing can be shown to the visitor until
// that full text exists and has been checked. handler.ts is what turns
// the final (possibly guardrail-replaced) text into a streamed HTTP
// response to the browser — see its header comment for the "why is this
// still called streaming" note.

import type Anthropic from "@anthropic-ai/sdk";

export const BRAIN_MODEL = "claude-haiku-4-5";
const MAX_RESPONSE_TOKENS = 1024;

export interface GenerateBrainResponseParams {
  client: Anthropic;
  systemPrompt: string;
  messages: Anthropic.MessageParam[];
}

export async function generateBrainResponse(
  params: GenerateBrainResponseParams,
): Promise<string> {
  const stream = params.client.messages.stream({
    model: BRAIN_MODEL,
    max_tokens: MAX_RESPONSE_TOKENS,
    system: params.systemPrompt,
    messages: params.messages,
  });

  const finalMessage = await stream.finalMessage();

  const text = finalMessage.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return text.trim();
}
