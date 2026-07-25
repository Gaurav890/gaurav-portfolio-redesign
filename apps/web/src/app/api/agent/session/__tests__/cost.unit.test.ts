import { describe, expect, it } from "vitest";
import {
  DAILY_BUDGET_USD,
  MONTHLY_BUDGET_USD,
  estimateSessionCostUsd,
  startOfUtcDay,
  startOfUtcMonth,
} from "../lib/cost";

describe("cost throttle constants", () => {
  it("matches the confirmed ADR-001 D6 (amended) figures", () => {
    expect(DAILY_BUDGET_USD).toBe(5);
    expect(MONTHLY_BUDGET_USD).toBe(60);
  });
});

describe("estimateSessionCostUsd", () => {
  it("estimates voice cost proportional to duration", () => {
    const oneMinute = estimateSessionCostUsd({ mode: "voice", durationSeconds: 60, turnCount: 3 });
    const sixMinutes = estimateSessionCostUsd({ mode: "voice", durationSeconds: 360, turnCount: 20 });
    expect(oneMinute).toBeGreaterThan(0);
    expect(sixMinutes).toBeCloseTo(oneMinute * 6, 5);
  });

  it("estimates text cost proportional to turn count, independent of duration", () => {
    const zero = estimateSessionCostUsd({ mode: "text", durationSeconds: 999, turnCount: 0 });
    const twenty = estimateSessionCostUsd({ mode: "text", durationSeconds: 0, turnCount: 20 });
    expect(zero).toBe(0);
    expect(twenty).toBeGreaterThan(0);
  });

  it("never returns a negative cost for negative/zero inputs", () => {
    expect(estimateSessionCostUsd({ mode: "voice", durationSeconds: -10, turnCount: 0 })).toBe(0);
    expect(estimateSessionCostUsd({ mode: "text", durationSeconds: 0, turnCount: -5 })).toBe(0);
  });

  it("a full 6-minute/20-turn voice session stays well under the daily budget", () => {
    const cost = estimateSessionCostUsd({ mode: "voice", durationSeconds: 360, turnCount: 20 });
    expect(cost).toBeLessThan(DAILY_BUDGET_USD);
  });
});

describe("UTC window boundaries", () => {
  it("startOfUtcDay truncates to midnight UTC", () => {
    const now = new Date("2026-07-24T15:42:10.123Z");
    expect(startOfUtcDay(now).toISOString()).toBe("2026-07-24T00:00:00.000Z");
  });

  it("startOfUtcMonth truncates to the 1st of the month, midnight UTC", () => {
    const now = new Date("2026-07-24T15:42:10.123Z");
    expect(startOfUtcMonth(now).toISOString()).toBe("2026-07-01T00:00:00.000Z");
  });

  it("the daily window is always a subset of the monthly window", () => {
    const now = new Date("2026-07-01T00:00:00.001Z");
    expect(startOfUtcDay(now).getTime()).toBeGreaterThanOrEqual(startOfUtcMonth(now).getTime());
  });
});
