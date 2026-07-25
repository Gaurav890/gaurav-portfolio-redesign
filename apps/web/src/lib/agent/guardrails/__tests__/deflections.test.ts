import { describe, expect, it } from "vitest";
import { pickDeflection } from "../deflections";

const CATEGORIES = [
  "system_prompt_extraction",
  "persona_break",
  "off_topic_test",
  "grounding_override",
  "harmful_content",
] as const;

describe("pickDeflection", () => {
  it.each(CATEGORIES)("returns non-empty, non-robotic text for %s", (category) => {
    const line = pickDeflection(category, 0);
    expect(line.length).toBeGreaterThan(10);
    // Per COPY.md's Voice section and this task's brief: never a flat
    // corporate refusal.
    expect(line.toLowerCase()).not.toBe("i can't help with that.");
    expect(line.toLowerCase()).not.toContain("i cannot assist with that");
  });

  it("never includes emoji (TTS-unsafe in voice mode)", () => {
    for (const category of CATEGORIES) {
      for (let seed = 0; seed < 5; seed++) {
        const line = pickDeflection(category, seed);
        expect(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(line)).toBe(false);
      }
    }
  });

  it("is deterministic for a given seed", () => {
    const a = pickDeflection("system_prompt_extraction", 1);
    const b = pickDeflection("system_prompt_extraction", 1);
    expect(a).toBe(b);
  });

  it("falls back to a generic line for 'none'", () => {
    const line = pickDeflection("none", 0);
    expect(line.length).toBeGreaterThan(0);
  });
});
