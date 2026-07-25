# Data model

Status: reflects the migrations in `packages/database/supabase/migrations/`
as of T-002 (2026-07-24). No live Supabase project exists yet — this
document describes schema that has not been run against a real instance
(see `packages/database/README.md`, "Constraints in this environment").

## Entities

### `contact_submissions` (FR-003)

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid`, PK | `gen_random_uuid()` |
| `name` | `text`, not null | |
| `email` | `text`, not null | |
| `message` | `text`, not null | |
| `submission_hash` | `text`, not null | App-computed `sha256(lower(trim(email)) \|\| '\|' \|\| trim(message))`; the idempotency key for AC-006's duplicate-submission check |
| `delivery_status` | `text`, not null, default `'pending'` | `pending` \| `delivered` \| `failed` |
| `created_at` | `timestamptz`, not null, default `now()` | |
| `updated_at` | `timestamptz`, not null, default `now()` | Auto-updated by `set_updated_at()` trigger on every `UPDATE` |

### `agent_sessions` (FR-013)

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid`, PK | `gen_random_uuid()`; the session ID returned to the browser by `POST /api/agent/session` |
| `mode` | `text`, not null | `voice` \| `text` |
| `started_at` | `timestamptz`, not null, default `now()` | Set at session creation |
| `ended_at` | `timestamptz`, nullable | Set at `POST /api/agent/session/end` |
| `duration_seconds` | `integer`, nullable | Set at session end |
| `turn_count` | `integer`, not null, default `0` | Updated per turn by `/api/agent/turn` |
| `cap_hit` | `boolean`, not null, default `false` | |
| `cap_hit_reason` | `text`, nullable | `duration` \| `turn_count` \| `monthly_ceiling` \| `guardrail_escalation` |
| `estimated_cost_usd` | `numeric(10,4)`, not null, default `0` | Blended Deepgram + ElevenLabs TTS + Claude Haiku estimate (ADR-001 D6, amended) |
| `created_at` | `timestamptz`, not null, default `now()` | |

**Never stores conversation content** — this is a hard architectural
invariant (`ARCHITECTURE.md` "Data ownership", ADR-001 D7 amended), not just
a current omission. Do not add a transcript/message column to this table;
use `agent_conversation_turns` for that, which has different retention
rules.

### `agent_conversation_turns` (FR-013, transient)

The resolved implementation of the storage-mechanism decision ADR-001 D7
(amended) and `ARCHITECTURE.md`'s Known debt section left open. See the
"Conversation-history storage mechanism" decision record below.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid`, PK | `gen_random_uuid()` |
| `session_id` | `uuid`, not null, FK → `agent_sessions.id` `on delete cascade` | |
| `turn_index` | `integer`, not null | 0-based order within the session |
| `role` | `text`, not null | `user` \| `assistant` |
| `content` | `text`, not null | The transcript/message text for this turn — sensitive, ephemeral |
| `created_at` | `timestamptz`, not null, default `now()` | |
| `expires_at` | `timestamptz`, not null, default `now() + 20 minutes` | Defense-in-depth backstop only — see Retention below |

## Relationships

- `agent_conversation_turns.session_id` → `agent_sessions.id`, `ON DELETE
  CASCADE`. If a session row is ever deleted directly, its turns are deleted
  with it (a secondary safety net; not the primary deletion path — see
  Retention below).
- `contact_submissions` has no foreign-key relationships; it is a standalone
  append-mostly table.
- No entity in this schema references anything outside this database. The
  voice-agent knowledge base (ADR-001 D2/D3, amended) is versioned repo
  content, not a database table (`ARCHITECTURE.md` "Module boundaries").

## Ownership

Per `ARCHITECTURE.md`'s "Data ownership" table:

| Table | Owner | Access |
|---|---|---|
| `contact_submissions` | `apps/web` backend (`/api/contact`, T-020) | Service-role only; PII (name, email, message), least-privilege (Gaurav only) |
| `agent_sessions` | `apps/web` backend (`/api/agent/session`, `/api/agent/turn`, `/api/agent/session/end`) | Service-role only; PII once linked to a session, least-privilege (Gaurav only) |
| `agent_conversation_turns` | `apps/web` backend (`/api/agent/turn`, `/api/agent/session/end`) | Service-role only; sensitive/ephemeral, least-privilege (Gaurav only) |

All three tables have RLS **enabled** with **no** policies granted to
`anon`/`authenticated` — the Supabase service-role key (used exclusively by
server-side Route Handlers, per NFR-003/AC-012) bypasses RLS entirely, so no
policy needs to grant it access, and no policy exists that would let the
browser's anon key read or write any of these tables directly. This matches
`ARCHITECTURE.md`'s "Module boundaries": content/UI code never talks to
Supabase directly.

## Retention

- **`contact_submissions`**: retained indefinitely. No automatic deletion is
  implemented — this is an operational/business record (Gaurav's contact
  inbox of record), and `ARCHITECTURE.md` specifies no retention window for
  it. If a retention policy is ever wanted, that's a new, explicit decision
  (per `.claude/rules/security.md`, not something to add silently to a
  migration).
- **`agent_sessions`**: retained indefinitely. This is metadata only (never
  conversation content) and powers the daily/monthly cost-throttle
  aggregation (ADR-001 D6, amended) and abuse-pattern observability — it
  needs history, not ephemerality.
- **`agent_conversation_turns`**: **zero retention beyond the live session,
  by design** (ADR-001 D7, amended). Two layers:
  1. **Primary mechanism**: an explicit `DELETE FROM agent_conversation_turns
     WHERE session_id = $1` issued by `POST /api/agent/session/end` (T-035,
     not yet implemented) at natural session end or cap-triggered end. This
     is what T-030's verification criterion ("conversation-history row is
     deleted at session end (test)") tests.
  2. **Defense-in-depth backstop**: the `expires_at` column (default 20
     minutes from insert — comfortably past the 6-minute hard session cap,
     ADR-001 D5 amended) plus the `cleanup_expired_agent_conversation_turns()`
     SQL function, for the case where the explicit delete never fires (crash,
     abandoned tab, client bug). Activating this sweep (via `pg_cron` or an
     external scheduler) is left as an implementation detail for whoever
     wires up T-030/T-035 against a real Supabase project — see the comment
     in `20260724120200_agent_conversation_turns.sql`.

### Decision record: conversation-history storage mechanism (T-002, 2026-07-24)

`ARCHITECTURE.md`'s Known debt section and ADR-001 D7 (amended) both flagged
this as an open implementation choice: a Supabase table vs. a short-TTL cache
(e.g. Vercel KV / Upstash Redis). **Decision: a Supabase table
(`agent_conversation_turns`), not a cache.**

Reasoning:

1. **One default backend per product profile**
   (`.claude/rules/architecture.md`). A Redis/Upstash/Vercel-KV cache is a
   second piece of infrastructure to provision, secure, and pay for. No ADR
   argues for a second backend here, and none exists or is planned per
   `docs/40-execution/CURRENT_STATE.md` ("no environment variables or
   accounts have been set up" for this rebuild).
2. **The cache's main advantage — automatic TTL expiry — is approximated**
   with the `expires_at` column and `cleanup_expired_agent_conversation_turns()`,
   as a defense-in-depth backstop alongside the actual retention guarantee
   (the explicit delete at session end). This gets most of the cache's
   safety property without a second vendor account.
3. **Consistent security posture.** This table inherits the same RLS
   deny-by-default, backup, and audit posture as `contact_submissions` and
   `agent_sessions` for free, rather than a separate system needing its own.
4. **No added latency in practice.** `/api/agent/turn` already needs a
   Supabase round-trip every turn to check the session cap against
   `agent_sessions` (ADR-001 D5, amended, computed server-side, not trusted
   from the client) — reading/writing conversation history in the same
   database adds no new vendor hop.

This is a judgment call, not a certainty: if `/api/agent/turn`'s Supabase
round-trip latency proves to be a real problem once T-030/T-032 are
implemented against a live project, revisit in favor of a short-TTL cache —
that would be a new, explicit decision (and likely worth its own ADR
amendment), not a silent schema change.

## Sensitive fields

| Table.column | Sensitivity | Notes |
|---|---|---|
| `contact_submissions.name`, `.email`, `.message` | PII | Never rendered unescaped anywhere (NFR-003) |
| `agent_sessions.*` | PII once linked to a session | No free-text content; still least-privilege per `.claude/rules/security.md` |
| `agent_conversation_turns.content` | Sensitive, ephemeral | May contain anything a visitor typed or said aloud; never logged in full outside a deliberate, logged incident investigation (ADR-001 D7, amended) |

No column in this schema stores raw audio. Audio is never persisted anywhere
in this stack, by construction — it flows browser↔Deepgram and
browser↔ElevenLabs directly (ADR-001 D3, amended) and never transits
`apps/web`'s backend.

## Indexes/performance

| Index | Table | Supports |
|---|---|---|
| `idx_contact_submissions_hash_created` | `contact_submissions` | AC-006 duplicate-window lookup: `(submission_hash, created_at desc)` |
| `idx_contact_submissions_created_at` | `contact_submissions` | Recency-ordered admin/operational queries |
| `idx_agent_sessions_started_at` | `agent_sessions` | Daily/monthly cost-throttle aggregation (ADR-001 D6, amended) |
| `idx_agent_sessions_cap_hit` (partial, `where cap_hit`) | `agent_sessions` | Cap-rate/abuse-pattern observability |
| `idx_agent_conversation_turns_session_order` | `agent_conversation_turns` | `(session_id, turn_index)` — the hot path read on every `/api/agent/turn` call |
| `idx_agent_conversation_turns_expires_at` | `agent_conversation_turns` | Defense-in-depth cleanup sweep |

## Migration notes

- Migrations live in `packages/database/supabase/migrations/` as
  timestamp-prefixed raw SQL files (Supabase-CLI-compatible naming), applied
  via `packages/database/scripts/migrate.sh`. See
  `packages/database/README.md` for the full convention and rationale.
- All three tables have Row Level Security **enabled** with no
  `anon`/`authenticated` policies (service-role-only access).
- Every migration uses `create ... if not exists` / `create or replace
  function`, so re-running an already-applied migration is a no-op.
- **Verified locally, not yet against a live Supabase project.** No Supabase
  project exists in this environment (`packages/database/README.md`,
  "Constraints"). What *has* been verified: all three migrations were
  applied — twice, to confirm idempotency — against a throwaway local
  vanilla PostgreSQL 15 instance (`initdb`/`pg_ctl`, no cloud account), with
  passing checks for every constraint, the `updated_at` trigger, the
  `ON DELETE CASCADE`, the cleanup function, and RLS deny-by-default (see
  `packages/database/README.md`'s "Verification evidence" section for the
  full list). What's still outstanding is anything Supabase-specific (e.g.
  `pg_cron` availability, the real `anon`/`authenticated`/service-role
  wiring) — that requires someone with real credentials to run
  `migrate.sh` against a fresh Supabase project and confirm.
- Rollback: each migration is additive (new table/index/function); no
  migration in this initial set alters or drops existing schema, so there is
  nothing to roll back yet. When a future migration needs to alter or drop
  something, document the rollback path in that migration's own header
  comment, and treat it as a destructive-migration change requiring Gaurav's
  explicit approval before running against production
  (`.claude/rules/backend.md`, `.claude/rules/security.md`).
