// A fake Anthropic client for turn.integration.test.ts, shaped to satisfy
// both call sites this route uses: ../../lib/brain.ts's
// `client.messages.stream(...).finalMessage()` and
// ../../../../lib/agent/guardrails/classifier.ts's `client.messages.create(...)`
// tool-use call. No live ANTHROPIC_API_KEY exists in this environment —
// this is mocked evidence per .claude/rules/testing.md's mocked-vs-live
// distinction; see this task's final report for what is and isn't
// verified as a result.

import type Anthropic from "@anthropic-ai/sdk";

export interface FakeAnthropicConfig {
  /** Text the "brain" call (client.messages.stream) should return. Function form lets tests assert on the prompt it was called with. */
  brainResponse?: string | ((params: unknown) => string);
  /** Verdict the classifier call (client.messages.create) should return. */
  classifierVerdict?: { allowed: boolean; category: string; reason: string };
  /** If set, the brain call rejects with this error instead of returning text. */
  brainError?: Error;
  /** If set, the classifier call rejects with this error instead of returning a verdict. */
  classifierError?: Error;
  /** Captures every params object passed to messages.create/stream, for assertions. */
  onCall?: (kind: "brain" | "classifier", params: unknown) => void;
}

export function createFakeAnthropicClient(config: FakeAnthropicConfig = {}): Anthropic {
  const classifierVerdict = config.classifierVerdict ?? {
    allowed: true,
    category: "none",
    reason: "ok",
  };

  return {
    messages: {
      stream(params: unknown) {
        config.onCall?.("brain", params);
        return {
          async finalMessage() {
            if (config.brainError) throw config.brainError;
            const text =
              typeof config.brainResponse === "function"
                ? config.brainResponse(params)
                : config.brainResponse ?? "This is a fake grounded response.";
            return {
              id: "msg_fake_brain",
              type: "message",
              role: "assistant",
              model: "claude-haiku-4-5",
              content: [{ type: "text", text }],
              stop_reason: "end_turn",
              stop_sequence: null,
              usage: { input_tokens: 10, output_tokens: 10 },
            };
          },
        };
      },
      async create(params: unknown) {
        config.onCall?.("classifier", params);
        if (config.classifierError) throw config.classifierError;
        return {
          id: "msg_fake_classifier",
          type: "message",
          role: "assistant",
          model: "claude-haiku-4-5",
          content: [
            {
              type: "tool_use",
              id: "toolu_fake",
              name: "submit_verdict",
              input: classifierVerdict,
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
