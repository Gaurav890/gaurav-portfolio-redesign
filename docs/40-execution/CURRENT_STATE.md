# Current state

Last updated: 2026-07-25

## Product

The portfolio rebuild has a fully assembled, content-complete home page on `main`: Hero, About (verbatim narrative), Experience (5 roles — see note below), Featured Projects (6, one sparse), Events (intentional sparse state), Credentials, and a Contact section with CTAs. The `/notes` route exists and renders its empty state. The contact-form backend is implemented and tested; the voice-agent session lifecycle (start/end) is implemented and tested. Still missing: the contact form's frontend UI (T-021), the voice agent's `/api/agent/turn` LLM handler and guardrail classifier (T-032/T-033/T-034), the voice-agent widget UI (T-037/T-038), Notes comments/RSS (T-023/T-024/T-018), analytics-tool confirmation, and all security-gate/QA/launch work (T-060 onward).

**Known content gap carried forward:** `TASKS.jsonl`'s T-012 originally assumed 6 Experience roles; only 5 exist in any source (`PRODUCT_CONTEXT.md` and the live site both confirm 5). Built with the real 5 — this was the orchestrator's own decomposition error, not something requiring Gaurav's input.

## Web

Implemented and merged to `main`:
- **Foundation (T-001–T-003):** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Framer Motion on a pnpm workspace, deployable on Vercel. Semantic design tokens (light/dark) wired via Tailwind v4 `@theme`. Typography: Fraunces (display), Inter (sans), IBM Plex Mono (mono). Shared `usePrefersReducedMotion()` hook and `<FadeIn>` primitive. Root layout with semantic landmarks and keyboard-operable mobile nav.
- **Content sections (T-010–T-017, T-050):** Hero (server-rendered, no-JS-dependency per AC-010), About (Gaurav's verbatim narrative from `COPY.md`), Experience (5-role expandable timeline), Featured Projects (6 cards — ELDA.AI, Aakha.org, NepalElection.chat, vocal-stack, AquaOracle, Dr. Birkhe), Events (intentional empty state), Credentials (education/achievements/community), Notes (MDX list+detail, zero posts, ready for tags/RSS/comments), Contact actions (Calendly with verified fallback, mailto, resume download), and `@vercel/analytics`-backed page-view/scroll-depth/CTA-click tracking. All wired into `apps/web/src/app/page.tsx` in an integration pass after the individual component branches merged.
- **Contact-form backend (T-020):** `POST /api/contact` — server-side validation, honeypot, Supabase duplicate-hash idempotency, durable-insert-then-deliver via Resend, explicit fail-closed error states. 28 tests passing against a real local Postgres instance.
- **Voice-agent session handlers (T-031/T-035):** `POST /api/agent/session` (cost-throttle check, Deepgram/ElevenLabs token minting, graceful text-only degradation) and `POST /api/agent/session/end` (idempotent metadata write + explicit conversation-history deletion). 35 tests passing against a real local Postgres instance, mocked token minters.

**Known gaps needing Gaurav's input before launch (not blocking further build):**
- Dr. Birkhe project card is sparse — no external link/tech-stack yet (OQ-013 residual).
- Resume download uses a placeholder PDF (`apps/web/public/resume-placeholder.pdf`) — needs the real file (OQ-005).
- Calendly URL is a placeholder (`NEXT_PUBLIC_CALENDLY_URL`) — needs Gaurav's real scheduling link.

Verified on the fully assembled page: `pnpm lint`/`pnpm typecheck`/`pnpm build` pass, all 63 tests pass, Playwright-inspected at 390px/1440px in light and dark mode. Not yet re-verified at 768px or with `prefers-reduced-motion` on the *assembled* page specifically (each component was verified individually at all breakpoints/states during its own build — a full assembled-page pass across all breakpoints/states is still owed, see T-070). Vercel preview deploy still unconfirmed (CLI permission limits in this environment persist).

## Mobile

Not applicable — this product is a responsive web site only (NG-007).

## Backend

Contact-form backend (T-020) and voice-agent session-start/session-end handlers (T-031/T-035) are implemented, tested locally, and merged. Still not implemented: `/api/agent/turn` (T-032, the LLM call + guardrail enforcement), the custom guardrail classifier itself (T-034 — still the single highest-risk piece of remaining work), the voice-agent knowledge base (T-033), and the cost-throttle/alerting refinement (T-036 — current session-start handler uses a placeholder cost estimate pending this).

Two follow-ups flagged by implementers, not yet actioned:
- T-020 introduced `CONTACT_TO_EMAIL`/`CONTACT_FROM_EMAIL` env vars not in the original `.env.example` — need documenting there and in `DEVELOPER_COMMANDS.md` before a live deploy.
- No schema field currently distinguishes "session throttled to text by daily budget" vs. "voluntarily text" — surfaced via an API response field for now; T-036 should decide if this needs a schema change.

Architecture: Supabase Postgres is the single backend datastore. Resend for contact-form email. The "Talk to Gaurav" voice agent is a **custom DIY pipeline** — Deepgram (STT) + Claude Haiku via the Anthropic Messages API + ElevenLabs (TTS only) — per `ADR-001`'s amendment. See `docs/30-engineering/ARCHITECTURE.md` for the full flow.

## Data

Schema implemented and merged: `contact_submissions`, `agent_sessions`, `agent_conversation_turns` (see `packages/database/supabase/migrations/`). All verified against a real local throwaway Postgres instance, not yet against a live Supabase project (no credentials provisioned in this environment — Gaurav is setting up accounts himself). `docs/30-engineering/DATA_MODEL.md` reflects the actual schema.

## Integrations

Still not provisioned with live credentials: Resend, Supabase, Deepgram, ElevenLabs, Anthropic. Gaurav has a personal ElevenLabs account (Free plan, 10,000 TTS credits) but voice cloning requires a paid tier — moot for now since FR-013 launches with a stock voice (Phase 1) and defers cloning to Phase 2. All code is written against the real SDKs and is provision-ready; nothing has been exercised against live services yet.

## Security

No security review has been performed yet. `ADR-001` D8 (amended) lists the prompt-injection threat surface to be checked once T-032/T-034 exist — this is a fully custom guardrail layer with no vendor product backing it, the single biggest pending risk in this project. `docs/30-engineering/SECURITY_MODEL.md`'s threats table is still empty. T-060 (contact-form security gate) is technically unblocked now that T-020/T-021 exist... except T-021 (the form UI) isn't built yet, so T-060 should wait for it.

## Verification

63 tests passing (28 contact-form, 35 voice-agent-session) against real local Postgres, all mocked/local per `.claude/rules/testing.md`'s mocked-vs-live distinction — nothing verified against live Supabase/Resend/Deepgram/ElevenLabs/Anthropic yet. Lint/typecheck/build clean on the fully assembled `main`. Playwright-verified at 390px/1440px, light/dark, on the assembled page; a full breakpoint/reduced-motion/a11y pass on the assembled page (T-070) is still owed.

## Known incomplete work

- OQ-001 residual gaps: Dr. Birkhe link/tech-stack, real resume PDF (OQ-005), real Calendly URL, voice sample for Phase 2 cloning (OQ-011, non-blocking).
- OQ-015 cost ceiling ($5/day, $60/mo) is confirmed by Gaurav — implemented in T-031, but T-036's refined cost model and alerting are not yet built.
- OQ-016 (default LLM: Claude Haiku recommended) remains open per Gaurav's "decide during implementation" — not yet needed until T-032 exists.
- OQ-004 (analytics tool) resolved with a default (`@vercel/analytics`) per its own non-blocking status — revisit if Gaurav has a preference.
- T-032 (`/api/agent/turn`), T-033 (knowledge base), T-034 (guardrail classifier — highest priority remaining risk), T-036 (refined cost throttle), T-037/T-038 (voice-agent widget UI), T-021 (contact form UI), T-018/T-023/T-024 (Notes RSS/comments), T-019 (SEO), T-022 (Vercel Firewall config), T-039 (ElevenLabs stock-voice account config) are all still `backlog`.
- T-060 onward (security gate, QA, performance, launch) have not started — correctly blocked on the above.
- No live Vercel preview deploy confirmed in this environment (CLI permission limits).

Only factual present-tense truth belongs here.
