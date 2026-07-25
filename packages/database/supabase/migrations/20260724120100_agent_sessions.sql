-- Voice/text agent session metadata (FR-013).
-- Owner: apps/web backend (/api/agent/session [T-031], /api/agent/turn
-- [T-032], /api/agent/session/end [T-035]).
--
-- Never stores conversation content, by design — see
-- agent_conversation_turns (0003 migration) for the separate, transient,
-- differently-governed table that holds live conversation history. Mixing
-- the two in one table would make it too easy to accidentally widen the
-- retention of conversation content when this table's own retention is meant
-- to be indefinite (it powers the cost-throttle history).
--
-- See docs/30-engineering/ARCHITECTURE.md ("Data ownership") and ADR-001
-- (amended) D5 (session caps), D6 (cost ceiling/alerting), and D7
-- (retention) for the rules this table exists to support.

create table if not exists public.agent_sessions (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('voice', 'text')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,
  turn_count integer not null default 0,
  cap_hit boolean not null default false,
  -- What tripped the cap, if any (ADR-001 D5/D8, amended): elapsed-duration
  -- cap, turn-count cap, the monthly cost ceiling refusing the session
  -- outright, or the guardrail classifier's repeated-violation escalation
  -- (D8, amended, control 4). Null until a cap actually fires.
  cap_hit_reason text
    check (
      cap_hit_reason is null
      or cap_hit_reason in ('duration', 'turn_count', 'monthly_ceiling', 'guardrail_escalation')
    ),
  estimated_cost_usd numeric(10, 4) not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.agent_sessions is
  'Voice/text agent session metadata only (FR-013) — never conversation content, per ARCHITECTURE.md''s Data ownership table and ADR-001 D7 (amended). PII once linked to a session; least-privilege access (Gaurav only).';
comment on column public.agent_sessions.duration_seconds is
  'Computed and set at POST /api/agent/session/end (T-035); null while the session is still live.';
comment on column public.agent_sessions.estimated_cost_usd is
  'Estimated spend for this session (Deepgram STT + ElevenLabs TTS + Claude Haiku, blended per ADR-001 D6 amended''s ~$0.02-0.04/min figure), recorded at session end and aggregated by T-036''s daily/monthly cost-throttle check.';
comment on column public.agent_sessions.cap_hit_reason is
  'duration | turn_count | monthly_ceiling | guardrail_escalation. Drives both the cost/cap observability dashboard and the security-gate reviewer''s evidence that guardrail escalation (D8 amended) actually fires in production, not just in the adversarial test script.';

-- Powers the daily/monthly cost-throttle aggregation (ADR-001 D6, amended):
-- "sum(estimated_cost_usd) for sessions started today / this month."
create index if not exists idx_agent_sessions_started_at
  on public.agent_sessions (started_at desc);

-- Powers cap-rate / abuse-pattern observability (ARCHITECTURE.md
-- "Observability") without a full-table scan once volume grows.
create index if not exists idx_agent_sessions_cap_hit
  on public.agent_sessions (cap_hit)
  where cap_hit;

-- RLS: deny-by-default, same posture as contact_submissions — service-role
-- only, no anon/authenticated policy.
alter table public.agent_sessions enable row level security;
