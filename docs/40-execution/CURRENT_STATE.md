# Current state

Last updated: 2026-07-24

## Product

`apps/web` now has a scaffolded, empty-content app shell (T-001, branch `feat/T-001-scaffold-web`) — no hero/about/experience/projects/events/contact content yet, that's T-010 onward. Architecture/ADR work is otherwise still ahead of most implementation.

## Web

T-001 done (pending PR/merge): a pnpm workspace root (`pnpm-workspace.yaml`, root `package.json` with `dev`/`build`/`lint`/`typecheck` scripts delegating to `apps/web`) wraps a Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Framer Motion app in `apps/web`, deployable on Vercel. See `docs/30-engineering/ADR/001-web-stack-and-voice-agent-provider.md` for the stack decision.

Concretely implemented:
- Semantic design tokens (`background`, `background-raised`, `foreground`, `foreground-muted`, `accent`, `accent-secondary`, `border`, `danger`, `success`) for light and dark mode, wired into Tailwind v4 via `@theme inline` in `apps/web/src/app/globals.css` (Tailwind v4 has no JS config file; tokens are CSS custom properties). Also defines `--radius-control/card/panel` per `DESIGN_SYSTEM.md`'s radius scale and a manual `data-theme` override hook for a future theme toggle.
- Typography roles wired via `next/font/google`: Fraunces (`font-display`), Inter (`font-sans`), IBM Plex Mono (`font-mono`).
- `apps/web/src/lib/motion/use-prefers-reduced-motion.ts` — a shared `usePrefersReducedMotion()` hook (via `useSyncExternalStore`, SSR-safe), and `apps/web/src/lib/motion/variants.ts` (`getFadeInUp`) plus `apps/web/src/components/motion/fade-in.tsx` (`<FadeIn>` wrapper) as the one shared entrance-animation primitive every future animated component should build on. A real bug was caught and fixed during Playwright verification: the reduced-motion variant originally omitted `y`, which left a stray `translateY(16px)` permanently applied when the hook's client-corrected value flipped after hydration — fixed by explicitly pinning `y: 0` in both reduced-motion states.
- Root layout (`apps/web/src/app/layout.tsx`) with semantic landmarks: `SiteHeader` (`header`+`nav`, keyboard-operable mobile-menu disclosure with `aria-expanded`/Escape-to-close), `main`, `SiteFooter` (`footer`).
- Nav per the PRD IA: Home (`/`), Projects (`/#projects`), Notes (`/notes`), Events (`/#events`), Contact (`/#contact`) — Projects/Events/Contact are anchors to homepage sections (matching T-013/T-014/T-016's `files_owned` being components, not routes); Notes is a real route matching T-017's `files_owned`.
- Bare-bones home page (`apps/web/src/app/page.tsx`) with empty placeholder sections (hero/about/experience/projects/events/credentials/contact) each labeling which later task fills it in. `/notes` placeholder route with the FR-015 zero-posts empty state.
- No content sections, forms, or voice-agent code added — out of scope per this task.

Verified: `pnpm lint`, `pnpm typecheck`, and `pnpm build` all pass; `./scripts/verify.sh quick` passes; `next dev` runs without errors; Playwright-inspected at 390px/768px/1440px, light and dark mode (system `prefers-color-scheme`), and with `prefers-reduced-motion: reduce` emulated. Not yet confirmed: an actual Vercel preview deploy — the `vercel` CLI is authenticated in this environment, but `vercel project ls`/linking was denied by the harness's permission system, so only `next build` succeeding locally has been confirmed, per this task's own documented fallback. No `gh` CLI is available in this environment, so no PR has been opened yet; the branch is pushed (or ready to push) for a human/orchestrator to open one.

## Mobile

Not applicable — this product is a responsive web site only (NG-007).

## Backend

Decided, not yet implemented: Supabase Postgres is the single backend datastore (contact submissions + voice-agent session metadata + transient live conversation history). Resend is the email-delivery provider for the contact form. The "Talk to Gaurav" voice agent is a **custom DIY pipeline** — Deepgram (STT) + Claude Haiku via the Anthropic Messages API (LLM/brain) + ElevenLabs (TTS only, for the cloned voice) — not a single hosted agent platform. This reverses the session's original decision (ElevenLabs Conversational AI / Agents Platform) per `ADR-001`'s 2026-07-24 amendment: Gaurav explicitly chose the cheaper DIY path after reviewing the cost/engineering-risk tradeoff, accepting that grounding/guardrails/session-caps/text-parity are now built by this project rather than provided natively. See `docs/30-engineering/ARCHITECTURE.md` and `ADR-001` (including its amendment) for the full flow.

## Data

No data has been created yet. Data model for contact submissions and voice-agent session metadata is specified in `docs/30-engineering/ARCHITECTURE.md` ("Data ownership") but not yet reflected in `docs/30-engineering/DATA_MODEL.md` (still template).

## Integrations

Decided, not yet configured: Resend (email), Supabase (datastore), Deepgram (STT), ElevenLabs (TTS + voice cloning only, not the Agents Platform), Anthropic (Claude Haiku via the Messages API), Vercel Firewall (rate limiting). None of these have been provisioned yet — no environment variables or accounts have been set up as part of this session.

## Security

No security review has been performed yet. `ADR-001` D8 (amended) lists the prompt-injection threat surface to be checked — this is now a fully custom guardrail layer with no vendor guardrail product backing it, which materially raises the scope of the pending security-gate review versus the session's original plan. The full threats table in `docs/30-engineering/SECURITY_MODEL.md` is still empty and must be populated and reviewed via the `security-gate` skill before the voice-agent or contact-form implementation merges (PRD launch criteria).

## Verification

`apps/web` (T-001 scaffold): `pnpm lint`/`pnpm typecheck`/`pnpm build` pass, `./scripts/verify.sh quick` passes, Playwright-verified at 390px/768px/1440px in light/dark/reduced-motion. No automated test suite exists yet (no `test` script — deliberately not added until real tests exist, to avoid `verify.sh full` failing on a missing script). Everything else (backend, contact form, voice agent) has no verification yet since it has no implementation yet on `main`.

## Known incomplete work

- OQ-001 (content-completion pass), OQ-005 (resume PDF currency), OQ-011 (voice sample for cloning) remain open and are prerequisites for implementation, not resolved by this session.
- OQ-015's exact cost-ceiling dollar figures ($5/day, $60/mo proposed) are pending Gaurav's explicit confirmation (see `ADR-001` D6 amended and open follow-ups).
- OQ-016 (default LLM: Claude Haiku recommended) remains open per Gaurav's "decide during implementation."
- The custom guardrail classifier required by `ADR-001` D8 (amended) is not yet designed — this is now the highest-priority new engineering task for FR-013.
- OQ-004 (analytics tool) remains open and non-blocking.
- T-001's Vercel-preview-deploy verification is unconfirmed in this environment (CLI authenticated, but project linking was denied by the harness's permission system) and its PR has not been opened (no `gh` CLI available) — both need a human or an environment with those capabilities to close out.
- No application code exists yet for the backend/contact-form/voice-agent work on `main` (T-002/T-003 have a separate branch/PR in flight but are not yet merged).

Only factual present-tense truth belongs here.
