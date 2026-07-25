import type { AgentMode, AgentSessionRecord, CapHitReason } from "./types";

// Shape of a raw agent_sessions row as returned by either the production
// Supabase client or the local-Postgres test double — both query the same
// column names (see packages/database/supabase/migrations/20260724120100_agent_sessions.sql),
// so a single mapping function is correct for both and keeps them from
// silently diverging.
export interface AgentSessionRow {
  id: string;
  mode: string;
  started_at: string | Date;
  ended_at: string | Date | null;
  duration_seconds: number | null;
  turn_count: number;
  cap_hit: boolean;
  cap_hit_reason: string | null;
  estimated_cost_usd: number | string;
  created_at: string | Date;
}

export function mapAgentSessionRow(row: AgentSessionRow): AgentSessionRecord {
  return {
    id: row.id,
    mode: row.mode as AgentMode,
    startedAt: toIso(row.started_at),
    endedAt: row.ended_at ? toIso(row.ended_at) : null,
    durationSeconds: row.duration_seconds,
    turnCount: row.turn_count,
    capHit: row.cap_hit,
    capHitReason: row.cap_hit_reason as CapHitReason | null,
    estimatedCostUsd: Number(row.estimated_cost_usd),
    createdAt: toIso(row.created_at),
  };
}

function toIso(value: string | Date): string {
  // node-postgres returns timestamptz columns as Date objects when queried
  // directly, but as ISO strings once serialized through JSON (Supabase/
  // PostgREST); normalize to always return an ISO string regardless of
  // which repo implementation produced the row.
  return typeof value === "string" ? value : value.toISOString();
}
