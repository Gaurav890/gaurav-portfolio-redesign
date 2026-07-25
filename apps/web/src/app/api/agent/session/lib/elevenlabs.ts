// Production ElevenLabs TTS single-use token minting (ADR-001 D3, amended).
//
// Verified against the installed @elevenlabs/elevenlabs-js v2.59.0 type
// definitions
// (node_modules/@elevenlabs/elevenlabs-js/dist/api/resources/tokens/resources/singleUse/client/Client.d.ts
// and .../api/types/SingleUseTokenResponseModel.d.ts): the SDK exposes
// `client.tokens.singleUse.create(tokenType)` returning
// `{ token: string }`, documented as "A time bound single use token that
// expires after 15 minutes. Will be consumed on use." — this is a genuine,
// real match for what ADR-001 D3 (amended) specifies ("single-use tokens
// expire in 15 minutes, same pattern ElevenLabs uses for its Agents Platform
// signed URLs"), and increases confidence versus the ADR's own flagged
// uncertainty (open follow-up 5) that this needed re-verification — the SDK
// literally has a `SingleUseTokenType.TtsWebsocket = "tts_websocket"` enum
// value scoped to exactly the plain-TTS product this ADR chose over the
// Agents Platform. Not exercised against the live ElevenLabs API in this
// environment (no credentials) — see the PR's verification notes.

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import type { MintedToken } from "./types";

// Per the SDK's own doc comment and ADR-001 D3 (amended): single-use TTS
// tokens expire in 15 minutes. Not returned by the API response itself
// (only the token string is), so it's a fixed known constant here.
const ELEVENLABS_TOKEN_TTL_SECONDS = 15 * 60;

const MINT_TIMEOUT_SECONDS = 5;

export function createElevenLabsTokenMinter(
  apiKey: string,
): () => Promise<MintedToken> {
  const client = new ElevenLabsClient({ apiKey });
  return async () => {
    const result = await client.tokens.singleUse.create("tts_websocket", {
      timeoutInSeconds: MINT_TIMEOUT_SECONDS,
    });
    return {
      token: result.token,
      expiresInSeconds: ELEVENLABS_TOKEN_TTL_SECONDS,
    };
  };
}
