// POST /api/contact — Route Handler (FR-003, T-020).
//
// Thin adapter: parses the request, wires up the real Supabase/Resend
// clients from server-only env vars, and delegates all orchestration logic
// to `handleContactSubmission` (handler.ts). See
// docs/30-engineering/ARCHITECTURE.md's "Contact-form submission" flow.
//
// Trust boundary: this is the browser <-> server boundary for untrusted
// visitor input (ARCHITECTURE.md "Trust boundaries"). Nothing here is
// rendered unescaped anywhere, and no third-party credential ever reaches
// the client (NFR-003).

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { readContactEnv } from "./env";
import { handleContactSubmission } from "./handler";
import { createSupabaseContactRepo } from "./supabase-repo";
import { createResendEmailSender } from "./resend-email-sender";

// Node.js runtime required: the Supabase and Resend SDKs are not Edge-safe,
// and this route needs process.env access to server-only secrets.
export const runtime = "nodejs";

function log(event: string, meta: Record<string, unknown>) {
  // Structured, single-line logs; never log full message bodies beyond
  // operational need (ARCHITECTURE.md "Observability"), and never log
  // secret values (.claude/rules/security.md).
  console.log(JSON.stringify({ event, ...meta }));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_input",
        fields: [{ field: "body", message: "Request body must be valid JSON." }],
      },
      { status: 400 },
    );
  }

  const envResult = readContactEnv();
  if (!envResult.ok) {
    // Fail closed with an explicit error rather than throwing an unhandled
    // exception. Expected in this environment (no live credentials are
    // provisioned yet) — never log which secret is missing beyond the
    // variable name, and never expose that detail to the client.
    log("contact.config_error", { missing: envResult.missing });
    return NextResponse.json({ ok: false, error: "configuration_error" }, { status: 500 });
  }

  const { env } = envResult;
  const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
  const resend = new Resend(env.resendApiKey);

  const repo = createSupabaseContactRepo(supabase);
  const emailSender = createResendEmailSender(resend, {
    to: env.contactToEmail,
    from: env.contactFromEmail,
  });

  const result = await handleContactSubmission(body, { repo, emailSender, logger: log });

  return NextResponse.json(result.body, { status: result.status });
}
