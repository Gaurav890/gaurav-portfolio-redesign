-- Contact form submissions (FR-003).
-- Owner: apps/web backend (/api/contact, T-020). PII — least-privilege access
-- (Gaurav only), per .claude/rules/security.md.
-- See docs/30-engineering/ARCHITECTURE.md ("Data ownership", "Primary flows")
-- and docs/30-engineering/DATA_MODEL.md for the full data contract this
-- migration implements.

create extension if not exists "pgcrypto";

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  -- App-computed sha256(lower(trim(email)) || '|' || trim(message)) at insert
  -- time (not a generated column — the app owns the exact normalization rule
  -- so it can evolve independently of the schema). Combined with created_at,
  -- this is the idempotency key for the AC-006 duplicate/spam check: reject a
  -- new submission if a row with the same hash exists within a short trailing
  -- time window (T-020 decides the exact window, e.g. a few minutes).
  submission_hash text not null,
  delivery_status text not null default 'pending'
    check (delivery_status in ('pending', 'delivered', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.contact_submissions is
  'Contact-form submissions (FR-003). PII: name, email, message. Least-privilege access (Gaurav only) per .claude/rules/security.md. Content is never rendered unescaped anywhere (NFR-003).';
comment on column public.contact_submissions.submission_hash is
  'App-computed sha256(lower(trim(email)) || ''|'' || trim(message)). Powers the AC-006 duplicate-submission check via (submission_hash, created_at).';
comment on column public.contact_submissions.delivery_status is
  'pending -> delivered | failed. Set to pending on insert, before the Resend attempt, per ARCHITECTURE.md''s durable-write-before-send flow (the row must never be silently left as the only record of a lost submission).';

-- Supports the AC-006 duplicate-window lookup: "does a row with this hash
-- exist within the last N minutes?" — most selective column first, newest
-- first for an early exit on the common (no-duplicate) path.
create index if not exists idx_contact_submissions_hash_created
  on public.contact_submissions (submission_hash, created_at desc);

-- Supports operational/admin queries ordered by recency.
create index if not exists idx_contact_submissions_created_at
  on public.contact_submissions (created_at desc);

-- Shared updated_at trigger helper. Safe to reuse across tables in this
-- package (see agent_sessions if it ever needs one); intentionally not
-- schema-qualified to a single table.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_contact_submissions_updated_at on public.contact_submissions;
create trigger trg_contact_submissions_updated_at
  before update on public.contact_submissions
  for each row
  execute function public.set_updated_at();

-- RLS: deny-by-default. apps/web's Route Handlers use the Supabase
-- service-role key exclusively (NFR-003/AC-012); the service role bypasses
-- RLS entirely, so no policy is required to grant it access. Deliberately no
-- policy is added for anon/authenticated — this table must never be readable
-- via the anon key from the browser.
alter table public.contact_submissions enable row level security;
