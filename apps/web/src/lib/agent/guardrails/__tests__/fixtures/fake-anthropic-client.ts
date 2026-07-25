// A fake Anthropic client shaped just enough to satisfy classifyResponse's
// usage of `client.messages.create(...)`. No live ANTHROPIC_API_KEY exists
// in this environment (per .claude/rules/testing.md's mocked-vs-live
// distinction) — this fixture is what lets the guardrail *policy logic* be
// tested exhaustively without a real API call, while classifier.ts itself
// is written against the real @anthropic-ai/sdk types so the integration
// code is real, not simulated.

import type Anthropic from "@anthropic-ai/sdk";

/** Builds a fake client whose classifier call always returns the given verdict via the submit_verdict tool_use shape classifier.ts expects. */
export function fakeClassifierClient(
  verdict: { allowed: boolean; category: string; reason: string },
): Anthropic {
  return {
    messages: {
      async create() {
        return {
          id: "msg_fake",
          type: "message",
          role: "assistant",
          model: "claude-haiku-4-5",
          content: [
            {
              type: "tool_use",
              id: "toolu_fake",
              name: "submit_verdict",
              input: verdict,
            },
          ],
          stop_reason: "tool_use",
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 10 },
        };
      },
    },
  } as unknown as Anthropic;
}

/** A fake client whose classifier call throws, to exercise the fail-closed path. */
export function throwingClassifierClient(message = "simulated network failure"): Anthropic {
  return {
    messages: {
      async create() {
        throw new Error(message);
      },
    },
  } as unknown as Anthropic;
}

/** A fake client whose classifier call returns a response with no tool_use block. */
export function malformedClassifierClient(): Anthropic {
  return {
    messages: {
      async create() {
        return {
          id: "msg_fake",
          type: "message",
          role: "assistant",
          model: "claude-haiku-4-5",
          content: [{ type: "text", text: "I decline to use the tool." }],
          stop_reason: "end_turn",
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 10 },
        };
      },
    },
  } as unknown as Anthropic;
}
