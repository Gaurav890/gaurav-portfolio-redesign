// Fake Deepgram/ElevenLabs token minters for tests. No live credentials
// exist in this environment (Deepgram/ElevenLabs/Supabase), so these stand
// in for the real SDK-backed minters in lib/deepgram.ts / lib/elevenlabs.ts
// — see the PR description for what is and isn't verified as a result.

import type { MintedToken, TokenMinters } from "../../lib/types";

export function createFakeTokenMinters(
  overrides: Partial<{
    mintDeepgramToken: () => Promise<MintedToken>;
    mintElevenLabsToken: () => Promise<MintedToken>;
  }> = {},
): TokenMinters {
  return {
    mintDeepgramToken:
      overrides.mintDeepgramToken ??
      (async () => ({ token: "fake-deepgram-token", expiresInSeconds: 30 })),
    mintElevenLabsToken:
      overrides.mintElevenLabsToken ??
      (async () => ({ token: "fake-elevenlabs-token", expiresInSeconds: 900 })),
  };
}

export function createFailingTokenMinter(message: string): () => Promise<MintedToken> {
  return async () => {
    throw new Error(message);
  };
}
