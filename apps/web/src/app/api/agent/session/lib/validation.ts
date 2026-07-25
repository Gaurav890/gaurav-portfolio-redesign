// Server-side input validation for both routes in this tree — independent
// of any client-side validation, per .claude/rules/backend.md ("Validate at
// every trust boundary"). Both POST /api/agent/session and
// POST /api/agent/session/end are visitor-facing, unauthenticated endpoints
// (see ARCHITECTURE.md trust boundaries), so their request bodies are
// untrusted input.

import type { AgentMode, CapHitReason } from "./types";

const MODES: readonly AgentMode[] = ["voice", "text"];
const CAP_HIT_REASONS: readonly CapHitReason[] = [
  "duration",
  "turn_count",
  "monthly_ceiling",
  "guardrail_escalation",
];
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export interface CreateSessionInput {
  mode: AgentMode;
}

export function parseCreateSessionInput(
  body: unknown,
): ValidationResult<CreateSessionInput> {
  if (body !== null && typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const record = (body ?? {}) as Record<string, unknown>;

  if (record.mode === undefined) {
    return { ok: true, value: { mode: "voice" } };
  }
  if (typeof record.mode !== "string" || !MODES.includes(record.mode as AgentMode)) {
    return {
      ok: false,
      error: `"mode" must be one of: ${MODES.join(", ")}.`,
    };
  }
  return { ok: true, value: { mode: record.mode as AgentMode } };
}

export interface EndSessionInput {
  sessionId: string;
  mode?: AgentMode;
  capHit?: boolean;
  capHitReason?: CapHitReason;
}

export function parseEndSessionInput(
  body: unknown,
): ValidationResult<EndSessionInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const record = body as Record<string, unknown>;

  if (typeof record.sessionId !== "string" || !UUID_RE.test(record.sessionId)) {
    return { ok: false, error: '"sessionId" must be a valid UUID string.' };
  }

  let mode: AgentMode | undefined;
  if (record.mode !== undefined) {
    if (typeof record.mode !== "string" || !MODES.includes(record.mode as AgentMode)) {
      return { ok: false, error: `"mode" must be one of: ${MODES.join(", ")}.` };
    }
    mode = record.mode as AgentMode;
  }

  let capHit: boolean | undefined;
  if (record.capHit !== undefined) {
    if (typeof record.capHit !== "boolean") {
      return { ok: false, error: '"capHit" must be a boolean.' };
    }
    capHit = record.capHit;
  }

  let capHitReason: CapHitReason | undefined;
  if (record.capHitReason !== undefined) {
    if (
      typeof record.capHitReason !== "string" ||
      !CAP_HIT_REASONS.includes(record.capHitReason as CapHitReason)
    ) {
      return {
        ok: false,
        error: `"capHitReason" must be one of: ${CAP_HIT_REASONS.join(", ")}.`,
      };
    }
    capHitReason = record.capHitReason as CapHitReason;
  }

  return { ok: true, value: { sessionId: record.sessionId, mode, capHit, capHitReason } };
}
