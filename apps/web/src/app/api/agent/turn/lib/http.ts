// Small HTTP helpers, deliberately duplicated from ../session/lib/http.ts
// rather than imported across the route-tree boundary. Both files are tiny
// (under 20 lines) and stable; duplicating avoids a cross-task-ownership
// import edge between two files that may be edited in parallel worktrees
// per .claude/rules/git-workflow.md ("one owner per file... during parallel
// work") — importing from a sibling task's directory would create exactly
// the kind of coupling that rule exists to avoid.

import { NextResponse } from "next/server";

export function jsonError(
  status: number,
  code: string,
  message: string,
  extra?: Record<string, unknown>,
): Response {
  return NextResponse.json({ error: code, message, ...extra }, { status });
}

/** Reads and parses a request body as JSON. An empty body parses to `{}`. */
export async function safeReadJson(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false }> {
  const text = await request.text();
  if (text.trim().length === 0) {
    return { ok: true, value: {} };
  }
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}
