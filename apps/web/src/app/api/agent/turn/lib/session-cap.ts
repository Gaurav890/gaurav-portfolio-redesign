// Session-cap enforcement (ADR-001 D5, amended): "fully custom, no native
// cap of any kind." Both the 6-minute duration cap and the 20-turn cap are
// computed here, server-side, against the session record's own
// started_at/turn_count — never trusted from the client, exactly because
// D5 (amended) calls this out as security-relevant, not just a UX nicety:
// "a user could try to manipulate a client-reported turn count."
//
// Soft steering: once either signal crosses ~75% of its limit, the system
// prompt (see lib/prompt.ts) is told to start naturally steering toward a
// warm wrap-up, so the hard cap reads as a natural conclusion rather than
// an abrupt cutoff (AC-016).

export const DURATION_CAP_SECONDS = 360; // 6 minutes
export const TURN_CAP = 20;
const SOFT_STEER_RATIO = 0.75;

export const DURATION_SOFT_STEER_SECONDS = DURATION_CAP_SECONDS * SOFT_STEER_RATIO; // 270s / 4:30
export const TURN_SOFT_STEER_COUNT = Math.floor(TURN_CAP * SOFT_STEER_RATIO); // 15

export type CapHitReason = "duration" | "turn_count" | "guardrail_escalation";

export interface SessionCapStatus {
  elapsedSeconds: number;
  /** turn_count value this exchange WOULD have after being recorded (i.e. existing turn_count + 1). */
  turnCountAfterThisTurn: number;
  hardCapHit: boolean;
  hardCapReason: CapHitReason | null;
  softSteerActive: boolean;
}

export function computeSessionCapStatus(params: {
  startedAt: Date;
  now: Date;
  existingTurnCount: number;
}): SessionCapStatus {
  const elapsedSeconds = Math.max(
    0,
    (params.now.getTime() - params.startedAt.getTime()) / 1000,
  );
  const turnCountAfterThisTurn = params.existingTurnCount + 1;

  const durationCapHit = elapsedSeconds >= DURATION_CAP_SECONDS;
  const turnCapHit = turnCountAfterThisTurn >= TURN_CAP;

  let hardCapReason: CapHitReason | null = null;
  if (durationCapHit) {
    hardCapReason = "duration";
  } else if (turnCapHit) {
    hardCapReason = "turn_count";
  }

  const softSteerActive =
    !hardCapReason &&
    (elapsedSeconds >= DURATION_SOFT_STEER_SECONDS ||
      turnCountAfterThisTurn >= TURN_SOFT_STEER_COUNT);

  return {
    elapsedSeconds,
    turnCountAfterThisTurn,
    hardCapHit: hardCapReason !== null,
    hardCapReason,
    softSteerActive,
  };
}
