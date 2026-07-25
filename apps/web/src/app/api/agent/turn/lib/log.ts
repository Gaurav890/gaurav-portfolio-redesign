// Structured, metadata-only logging for this route tree — duplicated from
// ../session/lib/log.ts for the same cross-worktree-isolation reason as
// http.ts in this directory. See that file's header comment.
//
// Hard rule (ADR-001 D7 amended, and doubly so here since this route holds
// conversation content in memory per-request): NEVER log conversation
// content (user message text, candidate/final response text) and never log
// full error objects that might embed request/auth details — only
// `.message`. Guardrail verdicts are logged by category/source/reason
// only, never by echoing the flagged text back into logs.

type LogFields = Record<string, string | number | boolean | undefined | null>;

export function logInfo(event: string, fields: LogFields = {}): void {
  console.log(
    JSON.stringify({ level: "info", event, ...fields, ts: new Date().toISOString() }),
  );
}

export function logError(
  event: string,
  sessionId: string | undefined,
  err: unknown,
): void {
  console.error(
    JSON.stringify({
      level: "error",
      event,
      sessionId,
      message: err instanceof Error ? err.message : String(err),
      ts: new Date().toISOString(),
    }),
  );
}
