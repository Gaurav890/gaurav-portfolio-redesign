import { describe, expect, it } from "vitest";
import { checkEscalation, DEFAULT_ESCALATION_THRESHOLD } from "../escalation";

describe("checkEscalation", () => {
  it("does not escalate on a single violation", () => {
    const result = checkEscalation({ priorViolationCount: 0, currentTurnViolated: true });
    expect(result.violationCount).toBe(1);
    expect(result.shouldEscalate).toBe(false);
  });

  it("does not escalate one below the threshold", () => {
    const result = checkEscalation({
      priorViolationCount: DEFAULT_ESCALATION_THRESHOLD - 2,
      currentTurnViolated: true,
    });
    expect(result.violationCount).toBe(DEFAULT_ESCALATION_THRESHOLD - 1);
    expect(result.shouldEscalate).toBe(false);
  });

  it("escalates exactly at the threshold", () => {
    const result = checkEscalation({
      priorViolationCount: DEFAULT_ESCALATION_THRESHOLD - 1,
      currentTurnViolated: true,
    });
    expect(result.violationCount).toBe(DEFAULT_ESCALATION_THRESHOLD);
    expect(result.shouldEscalate).toBe(true);
  });

  it("stays escalated past the threshold", () => {
    const result = checkEscalation({ priorViolationCount: 10, currentTurnViolated: true });
    expect(result.shouldEscalate).toBe(true);
  });

  it("does not count a clean turn toward escalation", () => {
    const result = checkEscalation({
      priorViolationCount: DEFAULT_ESCALATION_THRESHOLD - 1,
      currentTurnViolated: false,
    });
    expect(result.violationCount).toBe(DEFAULT_ESCALATION_THRESHOLD - 1);
    expect(result.shouldEscalate).toBe(false);
  });

  it("respects a custom threshold", () => {
    const result = checkEscalation({
      priorViolationCount: 0,
      currentTurnViolated: true,
      threshold: 1,
    });
    expect(result.shouldEscalate).toBe(true);
  });
});
