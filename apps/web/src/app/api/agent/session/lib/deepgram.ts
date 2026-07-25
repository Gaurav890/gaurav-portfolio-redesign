// Production Deepgram temporary-token minting (ADR-001 D3, amended).
//
// Verified against the installed @deepgram/sdk v5.7.0 type definitions
// (node_modules/@deepgram/sdk/dist/cjs/api/resources/auth/resources/v1/resources/tokens/client/Client.d.ts):
// `client.auth.v1.tokens.grant()` "Generates a temporary JSON Web Token (JWT)
// with a 30-second (by default) TTL and usage::write permission for core
// voice APIs" — this is exactly the mechanism
// developers.deepgram.com/guides/fundamentals/token-based-authentication
// describes and that ADR-001 D3 (amended) specifies. Not exercised against
// the live Deepgram API in this environment (no credentials) — see the PR's
// verification notes for what was and wasn't tested.

import { DeepgramClient } from "@deepgram/sdk";
import type { MintedToken } from "./types";

// Deepgram's temporary token "only needs to be valid for the initial
// WebSocket handshake — the connection then stays open independently, so a
// short TTL is safe and appropriate" (ADR-001 D3, amended). 30s is the SDK's
// own default; set explicitly here so the value is visible, not implicit.
const DEEPGRAM_TOKEN_TTL_SECONDS = 30;

// ARCHITECTURE.md "Timeouts and retries": "Deepgram/ElevenLabs token-mint
// calls use a short timeout (a few seconds); on timeout/error, return an
// explicit failure to the client rather than hanging."
const MINT_TIMEOUT_SECONDS = 5;

export function createDeepgramTokenMinter(
  apiKey: string,
): () => Promise<MintedToken> {
  const client = new DeepgramClient({ apiKey });
  return async () => {
    const result = await client.auth.v1.tokens.grant(
      { ttl_seconds: DEEPGRAM_TOKEN_TTL_SECONDS },
      { timeoutInSeconds: MINT_TIMEOUT_SECONDS },
    );
    return {
      token: result.access_token,
      expiresInSeconds: result.expires_in ?? DEEPGRAM_TOKEN_TTL_SECONDS,
    };
  };
}
