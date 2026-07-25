// Cost-throttle constants and estimation, per ADR-001 D6 (amended) and
// docs/40-execution/TASKS.jsonl T-031's confirmed 2026-07-24 figures.
//
// NOTE: this is a deliberately minimal, local implementation. T-036 ("Cost
// throttle and alerting implementation", files_owned
// apps/web/lib/agent/cost-throttle/**) is the task that owns the real,
// re-verified, shared cost-throttle module (including 50/80/100% alerting,
// which this task does not implement). T-031/T-035 need *some* throttle
// check and cost estimate to function at all, and T-036 explicitly depends
// on both of them existing first — so this module is the inline version
// T-036 is expected to extract/replace, not a permanent home for this logic.
// Kept here (not in apps/web/lib/agent/**) to respect this task's
// files_owned boundary.

import type { AgentMode } from "./types";

/** ADR-001 D6 (amended): app-level daily soft throttle, degrades to text-only. */
export const DAILY_BUDGET_USD = 5;

/** ADR-001 D6 (amended): monthly hard ceiling, refuses new sessions outright. */
export const MONTHLY_BUDGET_USD = 60;

// ADR-001 D6 (amended): "Blended estimate: roughly $0.02-0.04/min of voice
// conversation" (Deepgram STT + ElevenLabs TTS + amortized Claude Haiku).
// Midpoint used as a placeholder until T-036 re-verifies against real
// standalone ElevenLabs TTS pricing (ADR-001 open follow-up 5) and Deepgram's
// actual per-minute streaming cost under production conditions.
const VOICE_COST_PER_MINUTE_USD = 0.03;

// D6 (amended) describes text-only as "near-zero marginal cost" — this is a
// small nonzero placeholder for Claude Haiku's per-turn token cost (D6:
// "well under $0.02/session" for a full 20-turn session), so the throttle
// still means something for a hypothetical high-volume text-abuse pattern.
// Refine in T-036.
const TEXT_COST_PER_TURN_USD = 0.001;

export function startOfUtcDay(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export function startOfUtcMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function estimateSessionCostUsd(params: {
  mode: AgentMode;
  durationSeconds: number;
  turnCount: number;
}): number {
  if (params.mode === "voice") {
    const minutes = Math.max(0, params.durationSeconds) / 60;
    return round4(minutes * VOICE_COST_PER_MINUTE_USD);
  }
  return round4(Math.max(0, params.turnCount) * TEXT_COST_PER_TURN_USD);
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
