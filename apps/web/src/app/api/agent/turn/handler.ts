// Core logic for POST /api/agent/turn (T-032), separated from route.ts for
// direct testability, same pattern as ../session/handler.ts.
//
// Flow (ARCHITECTURE.md "Voice/text agent conversation" step 5; ADR-001
// D3/D5/D8, amended):
//   1. Validate the request body server-side.
//   2. Load the session (never trust client-reported session state) and
//      reject turns on a session that has already ended.
//   3. Compute the session-cap status server-side against the session's
//      own started_at/turn_count (D5, amended — never client-trusted).
//      If already at/over the cap before this turn even runs, skip the
//      brain/guardrail entirely and respond with the deterministic warm
//      wrap-up (AC-016) — idempotent if the client keeps sending turns
//      after a cap was already hit.
//   4. Otherwise: build the system prompt (persona + RAG context from the
//      knowledge base + soft cap-steer note), load conversation history,
//      and run the full guardrail pipeline (pattern preflight -> main
//      brain call -> post-generation classifier -> deflection routing ->
//      escalation check) via lib/agent/guardrails.runGuardedTurn.
//   5. Re-check the session cap using the time the generation actually
//      took (a slow generation can itself cross the duration cap) and
//      check the guardrail pipeline's own escalation signal; either one
//      overrides the response with the appropriate wrap-up template.
//   6. Persist the exchange (user turn + final assistant turn) and the
//      incremented turn_count in one repo call, then stream the
//      (guardrail-approved, possibly cap-reframed) text back to the
//      browser.
//
// This handler is the ONLY place in the request path that touches
// ANTHROPIC_API_KEY-derived state — via deps.anthropicClient, constructed
// once in lib/deps.ts, which is the only file that reads the env var by
// name. See that file's header comment for the full credential-scope
// guarantee this task's brief asks to grep-verify.

import { generateBrainResponse } from "./lib/brain";
import type { RouteDeps } from "./lib/deps";
import { jsonError, safeReadJson } from "./lib/http";
import { logError, logInfo } from "./lib/log";
import { buildMessages, buildSystemPrompt } from "./lib/prompt";
import { computeSessionCapStatus, type CapHitReason } from "./lib/session-cap";
import type { AgentMode } from "./lib/types";
import { parseCreateTurnInput } from "./lib/validation";
import { countPriorPatternViolations } from "./lib/violation-history";
import { buildWrapUpMessage } from "./lib/wrapup";
import { runGuardedTurn } from "@/lib/agent/guardrails";

const RESPONSE_HEADERS_CONTENT_TYPE = "text/plain; charset=utf-8";

export async function handleCreateTurn(
  deps: RouteDeps,
  request: Request,
): Promise<Response> {
  const rawBody = await safeReadJson(request);
  if (!rawBody.ok) {
    return jsonError(400, "invalid_json", "Request body must be valid JSON.");
  }

  const parsed = parseCreateTurnInput(rawBody.value);
  if (!parsed.ok) {
    return jsonError(400, "invalid_request", parsed.error);
  }
  const { sessionId, message, mode } = parsed.value;

  let session;
  try {
    session = await deps.repo.getSessionById(sessionId);
  } catch (err) {
    logError("agent_turn_session_lookup_failed", sessionId, err);
    return jsonError(502, "storage_unavailable", "Could not look up the session. Please retry.");
  }
  if (!session) {
    return jsonError(404, "session_not_found", "No agent session exists for the given sessionId.");
  }
  if (session.endedAt) {
    return jsonError(
      410,
      "session_already_ended",
      "This session has already ended. Start a new session to continue talking.",
    );
  }

  const startedAt = new Date(session.startedAt);
  const requestStart = deps.clock();
  const preCap = computeSessionCapStatus({
    startedAt,
    now: requestStart,
    existingTurnCount: session.turnCount,
  });

  if (preCap.hardCapHit) {
    return finalizeAndRespond(deps, {
      sessionId,
      mode: mode ?? session.mode,
      historyLength: undefined, // resolved inside finalizeAndRespond
      userMessage: message,
      finalResponse: buildWrapUpMessage(preCap.hardCapReason as CapHitReason),
      capHit: true,
      capHitReason: preCap.hardCapReason,
      existingTurnCount: session.turnCount,
    });
  }

  let history;
  try {
    history = await deps.repo.listConversationTurns(sessionId);
  } catch (err) {
    logError("agent_turn_history_load_failed", sessionId, err);
    return jsonError(502, "storage_unavailable", "Could not load conversation history. Please retry.");
  }

  const priorViolationCount = countPriorPatternViolations(history);
  const { systemPrompt, knowledgeContext } = buildSystemPrompt({
    query: message,
    softSteerActive: preCap.softSteerActive,
  });

  let guardedResult;
  try {
    guardedResult = await runGuardedTurn({
      userMessage: message,
      knowledgeContext,
      priorViolationCount,
      generateCandidateResponse: () =>
        generateBrainResponse({
          client: deps.anthropicClient,
          systemPrompt,
          messages: buildMessages({ history, newUserMessage: message }),
        }),
      classifierClient: deps.anthropicClient,
    });
  } catch (err) {
    logError("agent_turn_brain_failed", sessionId, err);
    return jsonError(
      502,
      "brain_unavailable",
      "Couldn't generate a response for that message. Please try again.",
    );
  }

  const postCap = computeSessionCapStatus({
    startedAt,
    now: deps.clock(),
    existingTurnCount: session.turnCount,
  });

  let finalResponse = guardedResult.finalResponse;
  let capHit = false;
  let capHitReason: CapHitReason | null = null;

  if (guardedResult.escalate) {
    finalResponse = buildWrapUpMessage("guardrail_escalation");
    capHit = true;
    capHitReason = "guardrail_escalation";
  } else if (postCap.hardCapHit) {
    finalResponse = buildWrapUpMessage(postCap.hardCapReason as CapHitReason);
    capHit = true;
    capHitReason = postCap.hardCapReason;
  }

  logInfo("agent_turn_guardrail_verdict", {
    sessionId,
    verdictAllowed: guardedResult.verdict.allowed,
    verdictCategory: guardedResult.verdict.category,
    verdictSource: guardedResult.verdict.source,
    brainWasCalled: guardedResult.brainWasCalled,
    violationCount: guardedResult.violationCount,
    escalate: guardedResult.escalate,
  });

  return finalizeAndRespond(deps, {
    sessionId,
    mode: mode ?? session.mode,
    historyLength: history.length,
    userMessage: message,
    finalResponse,
    capHit,
    capHitReason,
    existingTurnCount: session.turnCount,
  });
}

async function finalizeAndRespond(
  deps: RouteDeps,
  params: {
    sessionId: string;
    mode: AgentMode;
    historyLength: number | undefined;
    userMessage: string;
    finalResponse: string;
    capHit: boolean;
    capHitReason: CapHitReason | null;
    existingTurnCount: number;
  },
): Promise<Response> {
  let nextTurnIndexStart = params.historyLength;
  if (nextTurnIndexStart === undefined) {
    try {
      nextTurnIndexStart = (await deps.repo.listConversationTurns(params.sessionId)).length;
    } catch (err) {
      logError("agent_turn_history_load_failed", params.sessionId, err);
      return jsonError(502, "storage_unavailable", "Could not load conversation history. Please retry.");
    }
  }

  let turnCount: number;
  try {
    const result = await deps.repo.appendExchange({
      sessionId: params.sessionId,
      nextTurnIndexStart,
      userContent: params.userMessage,
      assistantContent: params.finalResponse,
      expectedCurrentTurnCount: params.existingTurnCount,
    });
    turnCount = result.turnCount;
  } catch (err) {
    logError("agent_turn_append_failed", params.sessionId, err);
    return jsonError(502, "storage_unavailable", "Could not record this turn. Please retry.");
  }

  logInfo("agent_turn_completed", {
    sessionId: params.sessionId,
    mode: params.mode,
    capHit: params.capHit,
    capHitReason: params.capHitReason ?? undefined,
    turnCount,
  });

  return streamTextResponse(params.finalResponse, {
    "X-Agent-Session-Id": params.sessionId,
    "X-Agent-Turn-Count": String(turnCount),
    "X-Agent-Cap-Hit": String(params.capHit),
    ...(params.capHitReason ? { "X-Agent-Cap-Hit-Reason": params.capHitReason } : {}),
  });
}

/**
 * Streams the final, guardrail-approved response text to the browser as a
 * standard Vercel HTTP streaming Response — "zero-config, no beta feature,
 * works today" per ADR-001 D3 (amended). The text itself is already fully
 * resolved by this point (see brain.ts's header comment for why nothing
 * can be forwarded live from Claude); this is what makes the *transport*
 * a streaming response, which is what "Stream the response" in this
 * task's brief and ARCHITECTURE.md's flow both actually require.
 */
function streamTextResponse(text: string, headers: Record<string, string>): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": RESPONSE_HEADERS_CONTENT_TYPE, ...headers },
  });
}
