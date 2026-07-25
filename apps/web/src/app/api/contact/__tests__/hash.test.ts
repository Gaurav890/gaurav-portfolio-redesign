import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { computeSubmissionHash } from "../hash";

describe("computeSubmissionHash", () => {
  it("matches the exact formula documented in the migration: sha256(lower(trim(email)) || '|' || trim(message))", () => {
    const expected = createHash("sha256").update("ada@example.com|Hello there").digest("hex");
    expect(computeSubmissionHash("ada@example.com", "Hello there")).toBe(expected);
  });

  it("normalizes email case and trims whitespace on both fields", () => {
    const a = computeSubmissionHash("  Ada@Example.com ", "  Hello there  ");
    const b = computeSubmissionHash("ada@example.com", "Hello there");
    expect(a).toBe(b);
  });

  it("produces different hashes for different messages", () => {
    const a = computeSubmissionHash("ada@example.com", "Hello there");
    const b = computeSubmissionHash("ada@example.com", "A different message");
    expect(a).not.toBe(b);
  });
});
