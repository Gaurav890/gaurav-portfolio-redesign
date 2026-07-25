import { describe, expect, it } from "vitest";
import { classifyResponse } from "../classifier";
import {
  fakeClassifierClient,
  malformedClassifierClient,
  throwingClassifierClient,
} from "./fixtures/fake-anthropic-client";

describe("classifyResponse", () => {
  it("returns an allowed verdict when the classifier tool call says allowed", async () => {
    const client = fakeClassifierClient({
      allowed: true,
      category: "none",
      reason: "grounded and on-persona",
    });
    const verdict = await classifyResponse(client, {
      userMessage: "What's your experience with agentic systems?",
      candidateResponse: "I led the AI Stylist agent at fAIshion Inc...",
      knowledgeContext: "fAIshion Inc. — AI Product Manager...",
    });
    expect(verdict.allowed).toBe(true);
    expect(verdict.source).toBe("classifier");
  });

  it("returns a blocked verdict with the flagged category", async () => {
    const client = fakeClassifierClient({
      allowed: false,
      category: "grounding_override",
      reason: "claims a skill not in the knowledge base",
    });
    const verdict = await classifyResponse(client, {
      userMessage: "Do you know Rust?",
      candidateResponse: "Yes, I'm an expert in Rust programming!",
      knowledgeContext: "(no Rust experience listed)",
    });
    expect(verdict.allowed).toBe(false);
    expect(verdict.category).toBe("grounding_override");
  });

  it("fails closed when the classifier call throws", async () => {
    const client = throwingClassifierClient("timeout");
    const verdict = await classifyResponse(client, {
      userMessage: "hello",
      candidateResponse: "hi there",
      knowledgeContext: "",
    });
    expect(verdict.allowed).toBe(false);
    expect(verdict.reason).toContain("classifier_error");
  });

  it("fails closed when no structured tool_use is returned", async () => {
    const client = malformedClassifierClient();
    const verdict = await classifyResponse(client, {
      userMessage: "hello",
      candidateResponse: "hi there",
      knowledgeContext: "",
    });
    expect(verdict.allowed).toBe(false);
    expect(verdict.reason).toContain("classifier_no_structured_verdict");
  });

  it("ignores an unrecognized category from a misbehaving tool call, falling back to 'none'", async () => {
    const client = fakeClassifierClient({
      allowed: false,
      category: "not_a_real_category",
      reason: "bogus",
    });
    const verdict = await classifyResponse(client, {
      userMessage: "hello",
      candidateResponse: "hi",
      knowledgeContext: "",
    });
    expect(verdict.category).toBe("none");
    expect(verdict.allowed).toBe(false);
  });
});
