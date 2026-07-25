// Structured, metadata-only logging for this route tree.
//
// Hard rule (ADR-001 D7 amended, task instructions for T-031/T-035): NEVER
// log conversation content, and never log full error objects or SDK
// responses that might embed request/auth details — only `.message`. These
// functions only ever accept scalar/metadata fields by design (see the
// `LogFields` type), so there is no code path here that could accidentally
// serialize a transcript or a credential.

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
