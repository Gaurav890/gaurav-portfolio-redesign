import { NextResponse } from "next/server";

export function jsonOk(body: unknown, status = 200): Response {
  return NextResponse.json(body, { status });
}

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
