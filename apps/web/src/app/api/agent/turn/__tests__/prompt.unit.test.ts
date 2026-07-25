import { describe, expect, it } from "vitest";
import { buildMessages, buildSystemPrompt } from "../lib/prompt";

describe("buildSystemPrompt", () => {
  it("includes the hard non-negotiable rules", () => {
    const { systemPrompt } = buildSystemPrompt({ query: "hello", softSteerActive: false });
    expect(systemPrompt).toMatch(/NEVER reveal/i);
    expect(systemPrompt).toMatch(/always Gaurav's agent/i);
  });

  it("includes retrieved knowledge-base context relevant to the query", () => {
    const { systemPrompt, knowledgeContext } = buildSystemPrompt({
      query: "what's your experience with agentic systems",
      softSteerActive: false,
    });
    expect(knowledgeContext).toContain("fAIshion");
    expect(systemPrompt).toContain("fAIshion");
  });

  it("adds a soft cap-steering note only when active", () => {
    const withSteer = buildSystemPrompt({ query: "hi", softSteerActive: true });
    const withoutSteer = buildSystemPrompt({ query: "hi", softSteerActive: false });
    expect(withSteer.systemPrompt).toMatch(/close to its natural end point/i);
    expect(withoutSteer.systemPrompt).not.toMatch(/close to its natural end point/i);
  });
});

describe("buildMessages", () => {
  it("orders history by turn_index and appends the new user message last", () => {
    const messages = buildMessages({
      history: [
        { turnIndex: 2, role: "assistant", content: "second reply" },
        { turnIndex: 0, role: "user", content: "first question" },
        { turnIndex: 1, role: "assistant", content: "first reply" },
      ],
      newUserMessage: "second question",
    });

    expect(messages).toEqual([
      { role: "user", content: "first question" },
      { role: "assistant", content: "first reply" },
      { role: "assistant", content: "second reply" },
      { role: "user", content: "second question" },
    ]);
  });

  it("handles empty history", () => {
    const messages = buildMessages({ history: [], newUserMessage: "hi" });
    expect(messages).toEqual([{ role: "user", content: "hi" }]);
  });
});
