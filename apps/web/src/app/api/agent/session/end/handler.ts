// Core logic for POST /api/agent/session/end (T-035), separated from
// route.ts for the same testability reason as ../handler.ts.
//
// Two responsibilities, in this order (ADR-001 D7, amended):
//   1. Explicitly DELETE this session's agent_conversation_turns rows FIRST
//      — this is the primary zero-retention privacy guarantee (the
//      expires_at/cleanup-function backstop is defense-in-depth only, per
//      DATA_MODEL.md). Deleting first means that even if the metadata write
//      below fails, conversation content is already gone; deleting an
//      empty/already-deleted set is a safe no-op, which is also what makes
//      this endpoint idempotent on the privacy-critical part.
//   2. Record final session metadata: duration and estimated cost are
//      computed server-side (never trusted from the client, consistent with
//      ADR-001 D5 (amended)'s "server-side, not client-trusted" principle
//      for cap/cost-relevant fields); turn_count is read from the existing
//      row (owned by /api/agent/turn, T-032, which is expected to update it
//      per turn) rather than accepted from the client at all; cap_hit/
//      cap_hit_reason are merged with whatever is already on the row so a
//      client can't downgrade a cap that server-side turn logic already
//      recorded.
//
// Idempotency (T-035 goal 1): if the session was already finalized by a
// prior call (ended_at already set), this handler does NOT recompute
// duration/cost — it returns the already-recorded result unchanged. That is
// what makes a client retry safe: duration would otherwise drift on every
// retry if recomputed from "now".
//
// Never logs or returns conversation content — the response body is
// metadata-only, matching AgentSessionRecord's shape (which has no content
// field at all).

import { estimateSessionCostUsd } from "../lib/cost";
import type { RouteDeps } from "../lib/deps";
import { jsonError, jsonOk, safeReadJson } from "../lib/http";
import { logError, logInfo } from "../lib/log";
import type { AgentSessionRecord } from "../lib/types";
import { parseEndSessionInput } from "../lib/validation";

export async function handleEndSession(
  deps: RouteDeps,
  request: Request,
): Promise<Response> {
  const rawBody = await safeReadJson(request);
  if (!rawBody.ok) {
    return jsonError(400, "invalid_json", "Request body must be valid JSON.");
  }

  const parsed = parseEndSessionInput(rawBody.value);
  if (!parsed.ok) {
    return jsonError(400, "invalid_request", parsed.error);
  }
  const { sessionId, mode, capHit, capHitReason } = parsed.value;

  let existing: AgentSessionRecord | null;
  try {
    existing = await deps.repo.getSessionById(sessionId);
  } catch (err) {
    logError("agent_session_end_lookup_failed", sessionId, err);
    return jsonError(
      502,
      "storage_unavailable",
      "Could not look up the session. Please retry.",
    );
  }
  if (!existing) {
    return jsonError(
      404,
      "session_not_found",
      "No agent session exists for the given sessionId.",
    );
  }

  // Primary privacy guarantee: delete conversation history before touching
  // metadata. Safe to run every time, including on idempotent retries — a
  // second delete of an already-empty set is a no-op.
  try {
    await deps.repo.deleteConversationTurns(sessionId);
  } catch (err) {
    logError("agent_session_end_delete_failed", sessionId, err);
    return jsonError(
      502,
      "storage_unavailable",
      "Could not clear conversation history. Please retry.",
    );
  }

  if (existing.endedAt) {
    // Idempotent replay: already finalized by a prior call. Do not
    // recompute duration/cost (would drift on every retry) — return the
    // already-recorded result unchanged.
    logInfo("agent_session_end_idempotent_replay", { sessionId });
    return jsonOk(toResponseBody(existing));
  }

  const now = deps.clock();
  const startedAt = new Date(existing.startedAt);
  const durationSeconds = Math.max(
    0,
    Math.round((now.getTime() - startedAt.getTime()) / 1000),
  );
  const finalMode = mode ?? existing.mode;
  // Never let a client-reported value *unset* a cap the server already
  // recorded (e.g. via /api/agent/turn mid-conversation); only let it add
  // one the server hasn't seen yet (e.g. a client-detected fallback path).
  const finalCapHit = existing.capHit || Boolean(capHit);
  const finalCapHitReason =
    existing.capHitReason ?? (capHit ? capHitReason ?? null : null);
  const estimatedCostUsd = estimateSessionCostUsd({
    mode: finalMode,
    durationSeconds,
    turnCount: existing.turnCount,
  });

  let finalized: AgentSessionRecord;
  try {
    finalized = await deps.repo.finalizeSession({
      id: sessionId,
      endedAt: now,
      durationSeconds,
      estimatedCostUsd,
      mode: finalMode,
      capHit: finalCapHit,
      capHitReason: finalCapHitReason,
    });
  } catch (err) {
    logError("agent_session_end_finalize_failed", sessionId, err);
    return jsonError(
      502,
      "storage_unavailable",
      "Could not record session metadata. Please retry.",
    );
  }

  logInfo("agent_session_end", {
    sessionId: finalized.id,
    mode: finalized.mode,
    durationSeconds: finalized.durationSeconds ?? undefined,
    turnCount: finalized.turnCount,
    capHit: finalized.capHit,
    capHitReason: finalized.capHitReason ?? undefined,
  });

  return jsonOk(toResponseBody(finalized));
}

function toResponseBody(session: AgentSessionRecord) {
  return {
    sessionId: session.id,
    mode: session.mode,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationSeconds: session.durationSeconds,
    turnCount: session.turnCount,
    capHit: session.capHit,
    capHitReason: session.capHitReason,
    estimatedCostUsd: session.estimatedCostUsd,
  };
}
