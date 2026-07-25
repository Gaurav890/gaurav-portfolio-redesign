// Production TurnRepo, backed by @supabase/supabase-js against the
// agent_sessions / agent_conversation_turns tables (both tables and their
// columns already exist — packages/database/supabase/migrations/ — no
// schema change was needed for this task; see mapping.ts and DATA_MODEL.md).
//
// Not verified against a live Supabase project in this environment (no
// credentials) — verified via a Postgres-backed test double
// (__tests__/fixtures/pg-repo.ts) against a local throwaway Postgres
// instance, per .claude/rules/testing.md's mocked-vs-live distinction.

import type { SupabaseClient } from "@supabase/supabase-js";
import { mapConversationTurnRow, mapSessionRow } from "./mapping";
import type { TurnRepo } from "./types";

const AGENT_SESSIONS_TABLE = "agent_sessions";
const AGENT_CONVERSATION_TURNS_TABLE = "agent_conversation_turns";

export function createSupabaseTurnRepo(client: SupabaseClient): TurnRepo {
  return {
    async getSessionById(id) {
      const { data, error } = await client
        .from(AGENT_SESSIONS_TABLE)
        .select()
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new Error(`getSessionById query failed: ${error.message}`);
      }
      return data ? mapSessionRow(data) : null;
    },

    async listConversationTurns(sessionId) {
      const { data, error } = await client
        .from(AGENT_CONVERSATION_TURNS_TABLE)
        .select()
        .eq("session_id", sessionId)
        .order("turn_index", { ascending: true });

      if (error) {
        throw new Error(`listConversationTurns query failed: ${error.message}`);
      }
      return (data ?? []).map(mapConversationTurnRow);
    },

    async appendExchange({
      sessionId,
      nextTurnIndexStart,
      userContent,
      assistantContent,
      expectedCurrentTurnCount,
    }) {
      const { error: insertError } = await client
        .from(AGENT_CONVERSATION_TURNS_TABLE)
        .insert([
          { session_id: sessionId, turn_index: nextTurnIndexStart, role: "user", content: userContent },
          { session_id: sessionId, turn_index: nextTurnIndexStart + 1, role: "assistant", content: assistantContent },
        ]);

      if (insertError) {
        throw new Error(`appendExchange insert failed: ${insertError.message}`);
      }

      const nextTurnCount = expectedCurrentTurnCount + 1;
      const { data, error: updateError } = await client
        .from(AGENT_SESSIONS_TABLE)
        .update({ turn_count: nextTurnCount })
        .eq("id", sessionId)
        .eq("turn_count", expectedCurrentTurnCount)
        .select("turn_count")
        .maybeSingle();

      if (updateError) {
        throw new Error(`appendExchange turn_count update failed: ${updateError.message}`);
      }
      if (!data) {
        throw new Error(
          `appendExchange: turn_count for session ${sessionId} changed concurrently (expected ${expectedCurrentTurnCount}); refusing to double-write`,
        );
      }

      return { turnCount: Number(data.turn_count) };
    },
  };
}
