# database

Supabase Postgres schema for the portfolio rebuild — the single backend
datastore per `docs/60-tooling/FINAL_STACK.md` ("Supabase as the default
backend profile") and `.claude/rules/architecture.md` ("one default backend
per product profile unless an ADR justifies more").

No live Supabase project is provisioned yet (see
`docs/40-execution/CURRENT_STATE.md`). This package contains only the
migration files and scaffolding needed so that applying them is a
one-command step once real credentials exist — nothing here has been run
against a live instance, and nothing in this repo is meant to provision one
(see "Constraints" below).

## Convention: plain SQL migrations, Supabase-CLI-compatible

Migrations live in `supabase/migrations/` as timestamp-prefixed, hand-written
`.sql` files — the same filename convention the Supabase CLI generates
(`YYYYMMDDHHMMSS_description.sql`), so this directory works with either the
Supabase CLI (`supabase db push`, after `supabase init` + `supabase link`) or
a plain `psql` run against `DATABASE_URL`. No ORM (Drizzle/Prisma) is used —
there's no application code in `apps/web` yet to generate a schema from, and
raw SQL keeps the migration format decoupled from whatever data-access
approach `apps/web`'s backend tasks (T-020, T-031, T-032, T-035) end up
using. Revisit this decision if/when the backend layer wants typed query
building — that would be a new ADR, not a silent change here.

Every migration is written to be safely re-runnable (`create ... if not
exists`, `create or replace function`) rather than assuming a CLI-managed
migration-history table, since no CLI has been run against a real project in
this environment yet.

## Schema at a glance

See `docs/30-engineering/DATA_MODEL.md` for the full data contract (entities,
relationships, ownership, retention, sensitive fields). Summary:

| Migration | Table | Purpose |
|---|---|---|
| `20260724120000_contact_submissions.sql` | `contact_submissions` | Contact-form submissions (FR-003) — name, email, message, delivery status, idempotency hash for AC-006 |
| `20260724120100_agent_sessions.sql` | `agent_sessions` | Voice/text agent session metadata only (FR-013) — timing, turn count, mode, cap-hit flag, estimated cost. Never conversation content. |
| `20260724120200_agent_conversation_turns.sql` | `agent_conversation_turns` | Transient live conversation history for an in-progress agent session — see the decision note inside that file for why this is a Supabase table and not a short-TTL cache (ADR-001 D7, amended; `docs/30-engineering/ARCHITECTURE.md` Known debt, now resolved) |

All three tables have Row Level Security enabled with **no** policies for
`anon`/`authenticated` — only the Supabase service-role key (used exclusively
by `apps/web`'s server-side Route Handlers, never the browser, per
NFR-003/AC-012) can read or write, since the service role bypasses RLS.

## Applying migrations

Once real Supabase credentials exist (Gaurav provisions the project and
hands over keys — see `docs/30-engineering/DEVELOPER_COMMANDS.md`):

```bash
./packages/database/scripts/migrate.sh
```

This picks the Supabase CLI (`supabase db push`) if it's installed and
linked, otherwise falls back to `psql "$DATABASE_URL"`, applying each file in
order. See the script's header comment for exact setup steps for either
path. It is safe to re-run.

## Verification evidence (T-002, 2026-07-24)

Distinguishing mocked/local evidence from live-system evidence per
`.claude/rules/testing.md`:

- **Verified locally** against a throwaway, local vanilla PostgreSQL 15
  instance (`initdb`/`pg_ctl`, no Docker, no cloud account, torn down
  immediately after) — not a Supabase project:
  - All three migrations apply cleanly, in order, on a fresh database.
  - Re-applying all three migrations a second time is a true no-op (the
    `if not exists` / `create or replace function` convention holds).
  - Every `check` constraint rejects the invalid value it's meant to
    (`delivery_status`, `agent_sessions.mode`, `agent_conversation_turns.role`).
  - The `set_updated_at()` trigger fires on `UPDATE`.
  - `agent_conversation_turns.session_id`'s `ON DELETE CASCADE` correctly
    removes a session's turns when the session row is deleted.
  - `cleanup_expired_agent_conversation_turns()` deletes exactly the rows
    past their `expires_at` and returns the correct count.
  - RLS deny-by-default holds even when a non-owner role is explicitly
    granted `SELECT`: the query succeeds but returns zero rows, since no
    policy grants that role visibility into any row.
- **Not verified**: a real Supabase project (this environment has no
  Supabase credentials — see "Constraints" below), so anything
  Supabase-specific and not present in vanilla Postgres — `pg_cron`
  availability/scheduling, Supabase Auth's actual `anon`/`authenticated`
  role wiring and PostgREST exposure, actual service-role bypass behavior —
  is unverified until someone with real credentials runs `migrate.sh`
  against a live project and confirms. Local vanilla-Postgres RLS behavior
  is a strong proxy for this (RLS is core Postgres, not a Supabase feature),
  but is not a substitute for the real thing.

## Constraints in this environment

- No live Supabase project exists yet, and this repo does not have
  credentials for Supabase, Deepgram, Anthropic, Resend, or ElevenLabs.
  "Migration runs cleanly against a fresh Supabase instance" (T-002's
  verification criterion) is confirmed against vanilla Postgres (above) but
  not yet against an actual Supabase project.
- Do not attempt to provision a live Supabase project, run these migrations
  against production, or perform a destructive migration without Gaurav's
  explicit approval, per `.claude/rules/security.md` and
  `.claude/rules/backend.md`.

## Related

- `docs/30-engineering/DATA_MODEL.md` — entities, relationships, ownership,
  retention, sensitive fields.
- `docs/30-engineering/ARCHITECTURE.md` — "Data ownership" table and the
  primary flows these tables support.
- `docs/30-engineering/ADR/001-web-stack-and-voice-agent-provider.md` — D5
  (session caps), D6 (cost ceiling), D7 (retention, including the
  conversation-history storage-mechanism decision this package implements).
