# Developer commands

Status: `apps/web` has no application code yet (`docs/40-execution/CURRENT_STATE.md`).
The commands below cover what exists today — repo-level verification and
environment/database setup (T-002, T-003). Framework-specific commands
(`pnpm dev`, `pnpm lint`, etc.) get filled in once `apps/web` is scaffolded
(T-001) and gain real `package.json` scripts; `./scripts/verify.sh` already
runs them automatically once they exist.

## Environment setup (new developer / Gaurav, first time)

No live credentials exist in this repo or in any agent's environment — every
account below must be provisioned by Gaurav (or whoever owns the relevant
account) and the keys handed over out-of-band. Nothing here should ever be
committed; `.gitignore` already excludes `.env*` except `.env.example` files.

1. **Copy the env template:**
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```
   (Also copy the root `.env.example` to `.env` if you need the
   Perplexity/Firecrawl MCP keys or the tooling-level Supabase vars — that's
   a separate, MCP/tooling-scoped file, not the app's runtime config.)

2. **Fill in each key** in `apps/web/.env.local`. Where to get each one:

   | Variable | Where to get it |
   |---|---|
   | `NEXT_PUBLIC_APP_URL` | No account needed — `http://localhost:3000` for local dev, the real domain in production. |
   | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Create a project at [supabase.com](https://supabase.com) → Project Settings → API. `SUPABASE_SERVICE_ROLE_KEY` is marked "secret" in the dashboard — never log or commit it (NFR-003/AC-012). |
   | `DEEPGRAM_API_KEY` | Create an account/project at [console.deepgram.com](https://console.deepgram.com) → API Keys. |
   | `ELEVENLABS_API_KEY` | Create an account at [elevenlabs.io](https://elevenlabs.io) → Profile → API Keys. Scope it to Text-to-Speech only if the dashboard supports key scoping (this project uses plain TTS, not the Agents Platform — ADR-001 D2, amended). Voice cloning (Instant/Professional Voice Cloning of Gaurav's voice) is separate account/dashboard configuration, not an env var — see ADR-001 D2 (amended) and T-039. |
   | `ANTHROPIC_API_KEY` | Create an account at [console.anthropic.com](https://console.anthropic.com) → Settings → API Keys. |
   | `RESEND_API_KEY` | Create an account at [resend.com](https://resend.com) → API Keys. The sending-domain DNS record is a separate, human-approval-gated production change (`.claude/rules/security.md`), not something set via env var alone. |

3. **How local dev picks these up:** once `apps/web` is scaffolded (T-001)
   as a standard Next.js App Router project, Next.js loads `.env.local`
   automatically for both `next dev` and `next build` — no extra tooling
   required. Route Handlers (`/api/contact`, `/api/agent/*`) read these via
   `process.env.*` server-side only; nothing in this list should ever be
   referenced from a Client Component or exposed via a `NEXT_PUBLIC_*` name
   (only `NEXT_PUBLIC_APP_URL` is intentionally public).

4. **Production:** the same variables are configured directly in Vercel's
   project environment settings (`ARCHITECTURE.md` "Deployment"), never
   committed. Changing production environment variables/credentials
   requires Gaurav's explicit approval (`.claude/rules/security.md`).

5. **Verify no real secret was committed:**
   ```bash
   grep -RInE '(sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{20,})' --include='*.env*' .
   ```
   should return nothing. `.claude/hooks/post-edit-secret-scan.sh` also runs
   this class of check automatically on file edits during a Claude Code
   session.

## Database setup (T-002)

Once a Supabase project exists and `SUPABASE_URL`/keys are filled in above:

```bash
./packages/database/scripts/migrate.sh
```

Applies every migration in `packages/database/supabase/migrations/` in
order. See `packages/database/README.md` for how the script picks between
the Supabase CLI and a direct `psql`/`DATABASE_URL` connection, and
`docs/30-engineering/DATA_MODEL.md` for the schema this creates.

Do not run this against a production Supabase project, and do not perform
any destructive migration, without Gaurav's explicit approval
(`.claude/rules/backend.md`, `.claude/rules/security.md`).

## Install

Repo tooling only for now (no `package.json` yet at the root or in
`apps/web`): `git`, `bash`, `python3` (used by the `scripts/*.sh` helpers),
and the Supabase CLI or `psql` if you plan to run migrations locally (see
above). Once T-001 scaffolds `apps/web`, this section gets a real
`pnpm install` (or equivalent) step.

## Dev

Not yet applicable — `apps/web` has no app to run. Once T-001 lands, this
becomes `pnpm --filter web dev` (or the framework's default dev command).

## Lint

Not yet applicable. `./scripts/verify.sh` already auto-detects and runs a
`lint` package script once one exists (see its `[6/6]` step).

## Typecheck

Not yet applicable — same auto-detection story as Lint, once TypeScript
config exists.

## Unit tests

Not yet applicable — same auto-detection story once a `test` package script
exists.

## Integration tests

Not yet applicable. Backend tasks that depend on this environment scaffolding
(T-020, T-023, T-031, T-032, T-035, T-036) each specify their own integration
test criteria in `docs/40-execution/TASKS.jsonl`'s `verification` field —
these will need real (or mocked, per `.claude/rules/testing.md`'s
mocked-vs-live distinction) Supabase/Resend/Deepgram/ElevenLabs/Anthropic
credentials to exercise for real.

## E2E

Not yet applicable — Playwright is the project default (`FINAL_STACK.md`)
and will be wired up once `apps/web` has pages to test (starting with T-010+).

## Full verification

```bash
./scripts/verify.sh quick   # repo-consistency checks: JSON/JSONL/YAML validity, shell script syntax, required collaboration files
./scripts/verify.sh full    # same, plus placeholders for framework-level checks once apps/web exists
```

## Deployment / platform configuration (not code, requires approval)

These are account/dashboard steps, not `git`-tracked commands, and each
requires Gaurav's explicit approval before a production change
(`.claude/rules/security.md`):

- Vercel Firewall rate-limit rules in front of `/api/contact`,
  `/api/agent/session`, `/api/agent/turn` (T-022) — document the exact
  configured rule here once set.
- ElevenLabs voice-cloning setup (Instant/Professional Voice Cloning of
  Gaurav's voice) and stock-voice selection for Phase 1 (T-039).
- Production cutover of `gauravchaulagain.com` and the Resend sending-domain
  DNS record.
