// POST /api/agent/session (T-031). Thin adapter: wires production
// dependencies and delegates to handler.ts, which contains all the actual
// logic and is what tests exercise directly. See handler.ts for the full
// flow description and lib/deps.ts for the credential-scope guarantee (this
// route never touches ANTHROPIC_API_KEY).

import { handleCreateSession } from "./handler";
import { getProductionDeps } from "./lib/deps";

export async function POST(request: Request): Promise<Response> {
  return handleCreateSession(getProductionDeps(), request);
}
