# /api/contact tests — local vs. live verification

Per `.claude/rules/testing.md`, distinguishing mocked/local evidence from
live-system evidence:

## What is verified locally (this test suite)

- `validation.test.ts`, `hash.test.ts` — pure unit tests, no I/O.
- `handler.unit.test.ts` — the orchestration logic in `handler.ts` against
  hand-written in-memory fakes for `ContactSubmissionsRepo` and
  `EmailSender`. Covers every branch (validation failure, honeypot,
  duplicate, storage failure at each step, Resend failure, partial-failure
  edge cases like `markDelivered` itself failing).
- `contact.integration.test.ts` — the same `handler.ts`, this time wired to
  `pg-contact-repo.ts`, a `ContactSubmissionsRepo` implementation using raw
  SQL against a **real, throwaway local PostgreSQL 15 instance**
  (`local-postgres.ts`: `initdb`/`pg_ctl`, no Docker, no cloud account,
  torn down after each run — the same approach `packages/database` used for
  the T-002 migration tests) running the actual
  `20260724120000_contact_submissions.sql` migration. This exercises real
  SQL semantics: the duplicate-window `WHERE` clause against real
  timestamps, the `delivery_status` `CHECK` constraint, and real
  `INSERT`/`UPDATE` round-trips — not a mock of Postgres behavior.
  `EmailSender` in this suite is a stub (no live Resend account exists in
  this environment).

## What is NOT verified locally

- **The real `@supabase/supabase-js` client / PostgREST transport.**
  `supabase-repo.ts` (the production implementation) is written against the
  real Supabase JS SDK, but this environment has no Docker daemon and no
  Supabase CLI, so there is no local PostgREST endpoint to point it at. The
  integration tests instead substitute `pg-contact-repo.ts`, which
  implements the identical `ContactSubmissionsRepo` interface via raw SQL
  against the same schema — a strong proxy for correctness of the query
  *logic*, but not a test of the Supabase HTTP layer, RLS-as-enforced-by-
  PostgREST, or service-role auth. `supabase-repo.ts` itself has no
  dedicated test file for this reason — its logic is a thin, direct mapping
  from the same operations `pg-contact-repo.ts` proves out, reviewed by hand
  against the `@supabase/supabase-js` API rather than executed.
- **The real `resend` SDK / a live Resend account.** No `RESEND_API_KEY`
  exists in this environment. `resend-email-sender.ts` is written against
  the real SDK's `client.emails.send(...)` call shape, but every test
  substitutes a stub `EmailSender`, never a real network call.
- **Route Handler <-> Next.js request/response plumbing end-to-end** (i.e.
  an actual `next dev` server receiving a real HTTP POST). `route.ts` is a
  thin adapter (parse JSON, read env, construct the two real clients,
  delegate to `handleContactSubmission`) reviewed by hand rather than
  covered by its own test, to keep the test suite decoupled from a running
  Next.js server; all of its branching logic lives in `handler.ts`, which
  *is* fully covered.

## Running

```bash
cd apps/web
pnpm test
```

Requires `initdb`/`pg_ctl` on `PATH` (or `PG_INITDB_BIN`/`PG_PG_CTL_BIN` env
vars pointing at them) for the integration suite; if unavailable, that
suite is skipped with a console warning rather than failing the whole run —
the unit tests still execute.
