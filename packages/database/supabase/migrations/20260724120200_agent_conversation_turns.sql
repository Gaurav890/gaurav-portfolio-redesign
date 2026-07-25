-- Transient live conversation-history storage for an in-progress agent
-- session (FR-013, T-030).
--
-- ============================================================================
-- DECISION (T-002, 2026-07-24): Supabase table, not a short-TTL cache.
-- ============================================================================
-- ADR-001 D7 (amended) explicitly left this open: "Two options for the
-- storage mechanism, both acceptable, to be decided during implementation:
-- (a) an in-memory/short-TTL cache ... or (b) a Supabase table row ...".
-- docs/30-engineering/ARCHITECTURE.md's Known debt section flagged the same
-- open call for whoever implements T-030. This migration is that decision:
-- option (b), a Supabase table.
--
-- Rationale:
--   1. One default backend per product profile (.claude/rules/architecture.md,
--      "Avoid premature microservices"). A Redis/Upstash/Vercel-KV cache is a
--      second piece of infrastructure to provision, secure, monitor, and pay
--      for. No ADR justifies that second backend for this product, and
--      docs/40-execution/CURRENT_STATE.md confirms no such account exists or
--      is planned ("no environment variables or accounts have been set up").
--   2. The one property a cache adds over a table — automatic TTL expiry —
--      is approximated below with the expires_at column and
--      cleanup_expired_agent_conversation_turns(), as defense-in-depth
--      alongside the actual primary mechanism: an explicit DELETE issued by
--      POST /api/agent/session/end (T-035) at natural end or cap-triggered
--      end. That explicit delete is what satisfies this table's own
--      verification criterion (T-030: "conversation-history row is deleted
--      at session end (test)") and ADR-001 D7 (amended)'s "deleted at
--      POST /api/agent/session/end" requirement — the TTL is a backstop for
--      the crash/abandoned-tab case, not the mechanism being tested.
--   3. Latency: /api/agent/turn already round-trips to Supabase every turn
--      for the session-cap check against agent_sessions (D5, amended, must be
--      computed server-side against the session record, not trusted from the
--      client). Reading/writing conversation history in the same database
--      adds no new network hop or vendor dependency versus a separate cache,
--      and can be done in the same transaction as a cap-check read if that
--      ever becomes useful.
--   4. Consistency of security posture: this table gets the same RLS
--      deny-by-default, backup, and audit posture as the rest of this
--      schema for free, rather than a second system needing its own.
--
-- This is a judgment call, not a certainty — if /api/agent/turn's Supabase
-- round-trip latency proves to be a real problem once implemented (T-030's
-- own concern, per Known debt), revisit in favor of a short-TTL cache. Until
-- then, this is the simpler, lower-infrastructure default.
-- ============================================================================

create table if not exists public.agent_conversation_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.agent_sessions (id) on delete cascade,
  turn_index integer not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now(),
  -- Defense-in-depth only — NOT the primary deletion mechanism (see decision
  -- note above). Set well past the 6-minute hard session cap (ADR-001 D5,
  -- amended) so a healthy session never hits it; exists purely to bound
  -- exposure if POST /api/agent/session/end is never called (crash,
  -- abandoned tab, client bug) and the explicit delete never fires.
  expires_at timestamptz not null default (now() + interval '20 minutes')
);

comment on table public.agent_conversation_turns is
  'Transient, in-progress conversation history for /api/agent/turn (FR-013). Primary deletion is the explicit DELETE at POST /api/agent/session/end (T-035); expires_at + cleanup_expired_agent_conversation_turns() are a defense-in-depth backstop only. Never retained beyond the live session by default (ADR-001 D7, amended). Sensitive: may contain anything a visitor typed or said aloud.';
comment on column public.agent_conversation_turns.turn_index is
  '0-based order within the session; reconstructs history in prompt order for /api/agent/turn''s system-prompt + RAG-context + history + new-turn construction (ADR-001 D3, amended).';
comment on column public.agent_conversation_turns.expires_at is
  'Defense-in-depth backstop only. The real "deleted at session end" guarantee is the explicit DELETE issued by POST /api/agent/session/end (T-035). See cleanup_expired_agent_conversation_turns() below.';

-- Reconstructing a session's history in order is the hot path — every single
-- /api/agent/turn call reads this.
create index if not exists idx_agent_conversation_turns_session_order
  on public.agent_conversation_turns (session_id, turn_index);

-- Powers the defense-in-depth cleanup sweep below.
create index if not exists idx_agent_conversation_turns_expires_at
  on public.agent_conversation_turns (expires_at);

alter table public.agent_conversation_turns enable row level security;

-- Defense-in-depth cleanup: deletes any row past its expires_at, i.e. any
-- session whose explicit end-of-session delete never happened. This is a
-- backstop, not the primary mechanism (see the decision note above) — the
-- primary mechanism is the explicit DELETE in POST /api/agent/session/end
-- (T-035, not yet implemented as of this migration).
--
-- Activation is an implementation detail for whoever wires up T-030/T-035,
-- and depends on what's available on the real (not-yet-provisioned) Supabase
-- project's plan. Either option is acceptable; pick one and document the
-- choice in docs/30-engineering/DEVELOPER_COMMANDS.md once real credentials
-- exist:
--   (a) pg_cron, if enabled on the project:
--         select cron.schedule(
--           'cleanup-expired-agent-conversation-turns',
--           '*/5 * * * *',
--           $$select public.cleanup_expired_agent_conversation_turns()$$
--         );
--   (b) an external scheduler (e.g. a Vercel Cron Job hitting a small,
--       internal-only maintenance Route Handler that calls this function via
--       the Supabase service-role client) if pg_cron isn't available on the
--       project's plan.
create or replace function public.cleanup_expired_agent_conversation_turns()
returns integer
language plpgsql
as $$
declare
  deleted_count integer;
begin
  delete from public.agent_conversation_turns
  where expires_at < now();
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

comment on function public.cleanup_expired_agent_conversation_turns() is
  'Defense-in-depth sweep for agent_conversation_turns rows whose session never called POST /api/agent/session/end. Not the primary deletion mechanism — see the table comment and the decision note at the top of this migration file. Schedule via pg_cron or an external cron hitting a maintenance endpoint.';
