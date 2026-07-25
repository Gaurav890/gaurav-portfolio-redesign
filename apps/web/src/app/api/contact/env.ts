// Reads and validates the environment variables /api/contact needs at
// request time. Deliberately lazy (not read at module import time) so the
// handler/route modules can be imported in tests without real env vars
// being set.
//
// Env var names match apps/web/.env.example exactly (T-003):
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY.
//
// CONTACT_TO_EMAIL / CONTACT_FROM_EMAIL are new variables this task
// introduces (Resend needs both a recipient and a verified sender address,
// and .env.example is outside this task's files_owned scope — see the PR
// description for the follow-up to add them there).

export interface ContactEnv {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  resendApiKey: string;
  /** Gaurav's notification inbox. */
  contactToEmail: string;
  /** Verified Resend sending address. */
  contactFromEmail: string;
}

export type ReadContactEnvResult = { ok: true; env: ContactEnv } | { ok: false; missing: string[] };

const REQUIRED_VARS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "CONTACT_TO_EMAIL",
  "CONTACT_FROM_EMAIL",
] as const;

export function readContactEnv(): ReadContactEnvResult {
  const values = Object.fromEntries(REQUIRED_VARS.map((name) => [name, process.env[name]]));
  const missing = REQUIRED_VARS.filter((name) => !values[name]);

  if (missing.length > 0) {
    return { ok: false, missing };
  }

  return {
    ok: true,
    env: {
      supabaseUrl: values.SUPABASE_URL as string,
      supabaseServiceRoleKey: values.SUPABASE_SERVICE_ROLE_KEY as string,
      resendApiKey: values.RESEND_API_KEY as string,
      contactToEmail: values.CONTACT_TO_EMAIL as string,
      contactFromEmail: values.CONTACT_FROM_EMAIL as string,
    },
  };
}
