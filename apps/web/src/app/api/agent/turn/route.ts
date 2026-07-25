// POST /api/agent/turn (T-032). Thin adapter: wires production
// dependencies and delegates to handler.ts, which contains all the actual
// logic and is what tests exercise directly. See handler.ts for the full
// flow description and lib/deps.ts for the credential-scope guarantee
// (this route is the ONLY place ANTHROPIC_API_KEY is read).

import { handleCreateTurn } from "./handler";
import { getProductionDeps } from "./lib/deps";

export async function POST(request: Request): Promise<Response> {
  return handleCreateTurn(getProductionDeps(), request);
}
