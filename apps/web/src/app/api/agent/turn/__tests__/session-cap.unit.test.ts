import { describe, expect, it } from "vitest";
import {
  computeSessionCapStatus,
  DURATION_CAP_SECONDS,
  DURATION_SOFT_STEER_SECONDS,
  TURN_CAP,
  TURN_SOFT_STEER_COUNT,
} from "../lib/session-cap";

const BASE = new Date("2026-07-24T12:00:00Z");

describe("computeSessionCapStatus", () => {
  it("reports no cap hit early in a fresh session", () => {
    const status = computeSessionCapStatus({
      startedAt: BASE,
      now: new Date(BASE.getTime() + 5_000),
      existingTurnCount: 1,
    });
    expect(status.hardCapHit).toBe(false);
    expect(status.softSteerActive).toBe(false);
  });

  it("hits the duration cap at exactly 6 minutes", () => {
    const status = computeSessionCapStatus({
      startedAt: BASE,
      now: new Date(BASE.getTime() + DURATION_CAP_SECONDS * 1000),
      existingTurnCount: 1,
    });
    expect(status.hardCapHit).toBe(true);
    expect(status.hardCapReason).toBe("duration");
  });

  it("activates soft steering at 75% of the duration cap", () => {
    const status = computeSessionCapStatus({
      startedAt: BASE,
      now: new Date(BASE.getTime() + DURATION_SOFT_STEER_SECONDS * 1000),
      existingTurnCount: 1,
    });
    expect(status.hardCapHit).toBe(false);
    expect(status.softSteerActive).toBe(true);
  });

  it("hits the turn-count cap at the 20th turn", () => {
    const status = computeSessionCapStatus({
      startedAt: BASE,
      now: BASE,
      existingTurnCount: TURN_CAP - 1,
    });
    expect(status.hardCapHit).toBe(true);
    expect(status.hardCapReason).toBe("turn_count");
  });

  it("activates soft steering at 75% of the turn cap", () => {
    const status = computeSessionCapStatus({
      startedAt: BASE,
      now: BASE,
      existingTurnCount: TURN_SOFT_STEER_COUNT - 1,
    });
    expect(status.hardCapHit).toBe(false);
    expect(status.softSteerActive).toBe(true);
  });

  it("prefers 'duration' as the reason when both caps trip on the same turn", () => {
    const status = computeSessionCapStatus({
      startedAt: BASE,
      now: new Date(BASE.getTime() + DURATION_CAP_SECONDS * 1000),
      existingTurnCount: TURN_CAP - 1,
    });
    expect(status.hardCapReason).toBe("duration");
  });

  it("clamps elapsed time to zero for a clock that appears to run backward", () => {
    const status = computeSessionCapStatus({
      startedAt: BASE,
      now: new Date(BASE.getTime() - 5_000),
      existingTurnCount: 0,
    });
    expect(status.elapsedSeconds).toBe(0);
  });
});
