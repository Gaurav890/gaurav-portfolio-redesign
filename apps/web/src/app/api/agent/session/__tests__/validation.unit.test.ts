import { describe, expect, it } from "vitest";
import { parseCreateSessionInput, parseEndSessionInput } from "../lib/validation";

describe("parseCreateSessionInput", () => {
  it("defaults mode to voice when omitted", () => {
    const result = parseCreateSessionInput({});
    expect(result).toEqual({ ok: true, value: { mode: "voice" } });
  });

  it("accepts an explicit valid mode", () => {
    expect(parseCreateSessionInput({ mode: "text" })).toEqual({ ok: true, value: { mode: "text" } });
  });

  it("rejects an invalid mode", () => {
    const result = parseCreateSessionInput({ mode: "bogus" });
    expect(result.ok).toBe(false);
  });

  it("rejects a non-object body", () => {
    expect(parseCreateSessionInput("not an object").ok).toBe(false);
    expect(parseCreateSessionInput(42).ok).toBe(false);
  });

  it("accepts a null body (treated as empty)", () => {
    expect(parseCreateSessionInput(null)).toEqual({ ok: true, value: { mode: "voice" } });
  });
});

describe("parseEndSessionInput", () => {
  const validId = "8f14e45f-ceea-467e-a5a8-2caa2fc21c34";

  it("requires a valid UUID sessionId", () => {
    expect(parseEndSessionInput({ sessionId: validId }).ok).toBe(true);
    expect(parseEndSessionInput({ sessionId: "not-a-uuid" }).ok).toBe(false);
    expect(parseEndSessionInput({}).ok).toBe(false);
  });

  it("rejects an invalid mode/capHit/capHitReason", () => {
    expect(parseEndSessionInput({ sessionId: validId, mode: "bogus" }).ok).toBe(false);
    expect(parseEndSessionInput({ sessionId: validId, capHit: "yes" }).ok).toBe(false);
    expect(parseEndSessionInput({ sessionId: validId, capHitReason: "bogus" }).ok).toBe(false);
  });

  it("accepts a fully populated valid body", () => {
    const result = parseEndSessionInput({
      sessionId: validId,
      mode: "voice",
      capHit: true,
      capHitReason: "duration",
    });
    expect(result).toEqual({
      ok: true,
      value: { sessionId: validId, mode: "voice", capHit: true, capHitReason: "duration" },
    });
  });
});
