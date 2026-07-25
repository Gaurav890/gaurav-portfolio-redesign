// Production dependency wiring for this route tree.
//
// CREDENTIAL SCOPE (ADR-001 D3, amended — "split-credential design"): this
// module reads SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEEPGRAM_API_KEY,
// and ELEVENLABS_API_KEY only. It MUST NEVER read process.env.ANTHROPIC_API_KEY
// — that credential is scoped exclusively to /api/agent/turn (T-032, a
// separate task/route not owned by this PR). Every env var this module
// reads is read lazily, inside getProductionDeps(), not at module load time
// — so importing this file (e.g. during `next build`'s route analysis)
// never throws even when secrets aren't configured in this environment.

import { createClient } from "@supabase/supabase-js";
import { createDeepgramTokenMinter } from "./deepgram";
import { createElevenLabsTokenMinter } from "./elevenlabs";
import { createSupabaseAgentSessionsRepo } from "./supabase-repo";
import type { AgentSessionsRepo, TokenMinters } from "./types";

export interface RouteDeps {
  repo: AgentSessionsRepo;
  tokenMinters: TokenMinters;
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
  const deepgramApiKey = requireEnv("DEEPGRAM_API_KEY");
  const elevenLabsApiKey = requireEnv("ELEVENLABS_API_KEY");

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  cached = {
    repo: createSupabaseAgentSessionsRepo(supabase),
    tokenMinters: {
      mintDeepgramToken: createDeepgramTokenMinter(deepgramApiKey),
      mintElevenLabsToken: createElevenLabsTokenMinter(elevenLabsApiKey),
    },
    clock: () => new Date(),
  };
  return cached;
}
