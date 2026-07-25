import { describe, expect, it } from "vitest";
import { parseCreateTurnInput } from "../lib/validation";

const validId = "8f14e45f-ceea-467e-a5a8-2caa2fc21c34";

describe("parseCreateTurnInput", () => {
  it("accepts a minimal valid body", () => {
    const result = parseCreateTurnInput({ sessionId: validId, message: "Hello" });
    expect(result).toEqual({ ok: true, value: { sessionId: validId, message: "Hello", mode: undefined } });
  });

  it("trims whitespace from the message", () => {
    const result = parseCreateTurnInput({ sessionId: validId, message: "  Hello  " });
    expect(result.ok).toBe(true);
    expect(result.ok && result.value.message).toBe("Hello");
  });

  it("rejects a missing sessionId", () => {
    expect(parseCreateTurnInput({ message: "hi" }).ok).toBe(false);
  });

  it("rejects an invalid sessionId", () => {
    expect(parseCreateTurnInput({ sessionId: "not-a-uuid", message: "hi" }).ok).toBe(false);
  });

  it("rejects a missing message", () => {
    expect(parseCreateTurnInput({ sessionId: validId }).ok).toBe(false);
  });

  it("rejects an empty/whitespace-only message", () => {
    expect(parseCreateTurnInput({ sessionId: validId, message: "   " }).ok).toBe(false);
  });

  it("rejects an overly long message", () => {
    const huge = "a".repeat(5000);
    expect(parseCreateTurnInput({ sessionId: validId, message: huge }).ok).toBe(false);
  });

  it("rejects a non-object body", () => {
    expect(parseCreateTurnInput("nope").ok).toBe(false);
    expect(parseCreateTurnInput(null).ok).toBe(false);
  });

  it("accepts a valid mode and rejects an invalid one", () => {
    expect(parseCreateTurnInput({ sessionId: validId, message: "hi", mode: "voice" }).ok).toBe(true);
    expect(parseCreateTurnInput({ sessionId: validId, message: "hi", mode: "bogus" }).ok).toBe(false);
  });
});
