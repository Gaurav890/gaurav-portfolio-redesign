// POST /api/agent/session/end (T-035). Thin adapter — see handler.ts for
// the full logic (the primary conversation-history deletion guarantee and
// idempotent metadata finalization) and ../lib/deps.ts for the
// credential-scope guarantee (this route never touches ANTHROPIC_API_KEY).

import { handleEndSession } from "./handler";
import { getProductionDeps } from "../lib/deps";

export async function POST(request: Request): Promise<Response> {
  return handleEndSession(getProductionDeps(), request);
}
