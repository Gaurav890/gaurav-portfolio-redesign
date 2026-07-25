// Production dependency wiring for this route tree.
//
// CREDENTIAL SCOPE: this is the ONLY module in the entire repository that
// reads process.env.ANTHROPIC_API_KEY. Every other module that needs to
// call Claude (brain.ts, ../../../../lib/agent/guardrails/classifier.ts)
// receives an already-constructed Anthropic client as a parameter — none
// of them touch process.env, and the literal string "ANTHROPIC_API_KEY"
// does not appear anywhere outside this file (grep-verified as part of
// this task's verification pass; see the PR description). This mirrors
// ../../session/lib/deps.ts's own credential-scope guarantee for
// DEEPGRAM_API_KEY/ELEVENLABS_API_KEY, and is the concrete implementation
// of ADR-001 D3 (amended)'s split-credential design: "ANTHROPIC_API_KEY...
// server-side only, and structurally so."
//
// Every env var is read lazily, inside getProductionDeps(), not at module
// load time — so importing this file (e.g. during `next build`'s route
// analysis) never throws even when secrets aren't configured in this
// environment.

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseTurnRepo } from "./supabase-repo";
import type { TurnRepo } from "./types";

export interface RouteDeps {
  repo: TurnRepo;
  anthropicClient: Anthropic;
  clock: () => Date;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

let cached: RouteDeps | null = null;

export function getProductionDeps(): RouteDeps {
  if (cached) return cached;

  const supabaseUrl = requireEnv("SUPABASE_URL");
  const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const anthropicApiKey = requireEnv("ANTHROPIC_API_KEY");

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  cached = {
    repo: createSupabaseTurnRepo(supabase),
    anthropicClient: new Anthropic({ apiKey: anthropicApiKey }),
    clock: () => new Date(),
  };
  return cached;
}
