// Core logic for POST /api/agent/session (T-031), separated from route.ts
// so it can be exercised directly in tests (with injected deps) without
// spinning up a Next.js server. route.ts is a thin adapter that wires
// production deps and delegates here.
//
// Flow (ARCHITECTURE.md "Voice/text agent conversation", steps 1-3; ADR-001
// D3/D6, amended):
//   1. Validate the request body server-side (independent of any client
//      validation).
//   2. Check the app-level daily/monthly cost throttle against
//      Supabase-tracked estimated spend.
//   3. Monthly ceiling hit -> refuse outright ("temporarily unavailable").
//      Daily ceiling hit -> still create a session, forced to text-only,
//      skip minting entirely (graceful degradation, never a refusal).
//      Otherwise -> honor the requested mode; for voice, mint both tokens
//      before creating the session row (so the row's mode always matches
//      what the client actually received) and fall back to a text-only
//      session if minting fails for any reason.
//
// This handler never reads process.env directly and never references
// ANTHROPIC_API_KEY in any form — see lib/deps.ts for the credential-scope
// guarantee.

import type { RouteDeps } from "./lib/deps";
import { jsonError, jsonOk, safeReadJson } from "./lib/http";
import { logError, logInfo } from "./lib/log";
import type { AgentMode, AgentSessionRecord, MintedToken } from "./lib/types";
import { parseCreateSessionInput } from "./lib/validation";

export async function handleCreateSession(
  deps: RouteDeps,
  request: Request,
): Promise<Response> {
  const rawBody = await safeReadJson(request);
  if (!rawBody.ok) {
    return jsonError(400, "invalid_json", "Request body must be valid JSON.");
  }

  const parsed = parseCreateSessionInput(rawBody.value);
  if (!parsed.ok) {
    return jsonError(400, "invalid_request", parsed.error);
  }
  const requestedMode = parsed.value.mode;

  let throttle;
  try {
    throttle = await deps.repo.getCostThrottleStatus(deps.clock());
  } catch (err) {
    logError("agent_session_throttle_check_failed", undefined, err);
    return jsonError(
      502,
      "storage_unavailable",
      "Could not check agent availability right now. Please try again shortly.",
    );
  }

  // Monthly hard ceiling: refuse outright, no session record. ADR-001 D6
  // (amended): "there's no vendor-level backstop... it's worth building the
  // monthly $60 ceiling as an actual hard stop... rather than only a soft
  // daily throttle-to-text-only."
  if (throttle.monthlyCapHit) {
    logInfo("agent_session_refused_monthly_ceiling", {
      monthlySpendUsd: throttle.monthlySpendUsd,
      monthlyBudgetUsd: throttle.monthlyBudgetUsd,
    });
    return jsonError(
      503,
      "temporarily_unavailable",
      "The talk-to-Gaurav agent is temporarily unavailable right now. Please reach out via the contact form or email in the meantime.",
      { reason: "monthly_cost_ceiling" },
    );
  }

  // Daily soft throttle: still create a session, forced to text-only, and
  // skip minting Deepgram/ElevenLabs tokens entirely — graceful
  // degradation, never a refusal (T-031 goal 3).
  if (throttle.dailyCapHit) {
    return createAndRespond(deps, "text", {
      degraded: true,
      degradedReason: "daily_cost_ceiling",
    });
  }

  if (requestedMode === "text") {
    // Visitor voluntarily chose text mode — no need to mint anything.
    return createAndRespond(deps, "text", { degraded: false });
  }

  // Under budget, voice requested: mint both tokens *before* creating the
  // session row, so the row we persist always matches what the client
  // actually receives (no separate "downgrade the row" step needed).
  //
  // This handler holds DEEPGRAM_API_KEY and ELEVENLABS_API_KEY only (via
  // deps.tokenMinters, constructed in lib/deps.ts) — never ANTHROPIC_API_KEY,
  // which belongs exclusively to /api/agent/turn (T-032) per ADR-001 D3
  // (amended)'s split-credential design.
  try {
    const [deepgram, elevenLabs] = await Promise.all([
      deps.tokenMinters.mintDeepgramToken(),
      deps.tokenMinters.mintElevenLabsToken(),
    ]);
    return createAndRespond(deps, "voice", {
      degraded: false,
      deepgram,
      elevenLabs,
    });
  } catch (err) {
    // ARCHITECTURE.md failure modes: "Deepgram or ElevenLabs token-mint
    // fails -> Client shows 'temporarily unavailable' state ... or offers
    // text-only mode ... never a broken/frozen widget." Since both legs are
    // required for a working voice conversation, any mint failure degrades
    // the whole session to text rather than partially succeeding.
    logError("agent_session_token_mint_failed", undefined, err);
    return createAndRespond(deps, "text", {
      degraded: true,
      degradedReason: "voice_unavailable",
    });
  }
}

async function createAndRespond(
  deps: RouteDeps,
  mode: AgentMode,
  extra: {
    degraded: boolean;
    degradedReason?: string;
    deepgram?: MintedToken;
    elevenLabs?: MintedToken;
  },
): Promise<Response> {
  let session: AgentSessionRecord;
  try {
    session = await deps.repo.createSession(mode);
  } catch (err) {
    logError("agent_session_create_failed", undefined, err);
    return jsonError(
      502,
      "storage_unavailable",
      "Could not start a new agent session. Please try again shortly.",
    );
  }

  logInfo("agent_session_created", {
    sessionId: session.id,
    mode: session.mode,
    degraded: extra.degraded,
    degradedReason: extra.degradedReason,
  });

  return jsonOk({
    sessionId: session.id,
    mode: session.mode,
    startedAt: session.startedAt,
    degraded: extra.degraded,
    ...(extra.degradedReason ? { degradedReason: extra.degradedReason } : {}),
    ...(extra.deepgram ? { deepgram: extra.deepgram } : {}),
    ...(extra.elevenLabs ? { elevenLabs: extra.elevenLabs } : {}),
  });
}
