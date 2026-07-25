// Row -> domain-type mapping, shared between the Supabase implementation
// and the Postgres-backed test double so both can't silently diverge on
// row-shaping, mirroring ../../session/lib/mapping.ts's own pattern
// (re-implemented locally per lib/http.ts's cross-worktree-isolation note).

import type { AgentMode, AgentSessionSnapshot, ConversationTurnRecord, TurnRole } from "./types";

export function mapSessionRow(row: Record<string, unknown>): AgentSessionSnapshot {
  return {
    id: row.id as string,
    mode: row.mode as AgentMode,
    startedAt: row.started_at as string,
    endedAt: (row.ended_at as string | null) ?? null,
    turnCount: Number(row.turn_count) || 0,
  };
}

export function mapConversationTurnRow(row: Record<string, unknown>): ConversationTurnRecord {
  return {
    turnIndex: Number(row.turn_index),
    role: row.role as TurnRole,
    content: row.content as string,
  };
}
