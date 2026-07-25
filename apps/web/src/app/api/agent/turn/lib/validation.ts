// Server-side input validation for POST /api/agent/turn — independent of
// any client-side validation, per .claude/rules/backend.md. This is a
// visitor-facing, unauthenticated endpoint carrying untrusted input
// (ARCHITECTURE.md: "this is THE prompt-injection trust boundary"), so
// everything here is treated as hostile until parsed into a known shape —
// note that "valid shape" is a separate question from "safe content,"
// which is the guardrail layer's job (../../../lib/agent/guardrails), not
// this file's.

import type { AgentMode } from "./types";

const MODES: readonly AgentMode[] = ["voice", "text"];
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Generous but bounded — long enough for a real spoken/typed thought, short
// enough that a single turn can't be used to smuggle in an enormous
// payload that inflates token cost or tries to overwhelm the guardrail
// classifier's context.
const MAX_MESSAGE_LENGTH = 4000;

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export interface CreateTurnInput {
  sessionId: string;
  message: string;
  mode?: AgentMode;
}

export function parseCreateTurnInput(body: unknown): ValidationResult<CreateTurnInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const record = body as Record<string, unknown>;

  if (typeof record.sessionId !== "string" || !UUID_RE.test(record.sessionId)) {
    return { ok: false, error: '"sessionId" must be a valid UUID string.' };
  }

  if (typeof record.message !== "string") {
    return { ok: false, error: '"message" must be a string.' };
  }
  const trimmed = record.message.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: '"message" must not be empty.' };
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      error: `"message" must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
    };
  }

  let mode: AgentMode | undefined;
  if (record.mode !== undefined) {
    if (typeof record.mode !== "string" || !MODES.includes(record.mode as AgentMode)) {
      return { ok: false, error: `"mode" must be one of: ${MODES.join(", ")}.` };
    }
    mode = record.mode as AgentMode;
  }

  return { ok: true, value: { sessionId: record.sessionId, message: trimmed, mode } };
}
