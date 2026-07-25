# Architecture

Status: Draft — reflects `ADR-001` (voice-agent provider and apps/web stack) **as amended 2026-07-24** (DIY Deepgram + Claude Haiku + ElevenLabs TTS pipeline, replacing the original ElevenLabs Agents Platform decision — see the amendment banner at the top of `ADR-001`). Content-level sections (final copy, project list) still pending the content-completion pass; this document describes system structure, which does not depend on that pass.

## System context

`apps/web` is a single Next.js application (App Router, TypeScript, Tailwind, Framer Motion) deployed on Vercel, serving Gaurav Chaulagain's personal portfolio. It has two backend-touching flows in addition to the static/content pages: the contact form (FR-003) and the voice/text conversational agent (FR-013). Both are server-mediated so that no third-party credential ever reaches the browser (NFR-003, AC-012, AC-018). The voice agent is a custom-built pipeline (Deepgram STT + Claude Haiku LLM + ElevenLabs TTS), not a single hosted agent platform — see `ADR-001`'s amendment for the full comparison and reversal rationale.

## Components

- **Next.js app (`apps/web`)** — renders all content sections (hero, about, experience, projects, case studies, education, community, contact) as server-rendered pages/components; owns the client-side voice/chat widget UI.
- **`/api/contact` Route Handler** — validates, rate-limits, persists, and forwards contact-form submissions.
- **`/api/agent/session` Route Handler** — mints short-lived Deepgram and ElevenLabs tokens for a new conversation, enforces the cost throttle before minting, and creates the session record. Does not hold `ANTHROPIC_API_KEY`.
- **`/api/agent/turn` Route Handler** — the one mandatory server-mediated hop for every conversational turn, voice or text: builds the prompt (system prompt + RAG context + history), calls the Anthropic Messages API (Claude Haiku), runs the custom guardrail classifier on the response, and enforces the session-duration/turn-count cap. This is where `ANTHROPIC_API_KEY` lives and where the custom guardrail layer (ADR-001 D8) executes.
- **`/api/agent/session/end` Route Handler** — records final session metadata (duration, turns, mode, cap-hit flag, estimated cost) and deletes any transient conversation-history record for that session.
- **Supabase (Postgres)** — the single backend datastore: contact submissions (with delivery status), voice-agent session metadata (no conversation content), and transiently, live conversation history for the duration of an active session only (ADR-001 D7, amended).
- **Resend** — outbound email delivery for contact-form notifications to Gaurav.
- **Deepgram** — speech-to-text. The browser connects directly to Deepgram's streaming STT WebSocket using a short-lived temporary token minted by `/api/agent/session`; `DEEPGRAM_API_KEY` never reaches the browser.
- **ElevenLabs (Text-to-Speech only, not the Agents Platform)** — synthesizes Gaurav's cloned voice from text. The browser connects directly to ElevenLabs' TTS WebSocket using a short-lived single-use token minted by `/api/agent/session`; the ElevenLabs API key never reaches the browser.
- **Anthropic Claude Haiku (via the Messages API)** — the conversational "brain." Always called server-side from `/api/agent/turn` — the Anthropic Messages API has no ephemeral/client-token mechanism, so this leg cannot be a direct browser connection the way Deepgram/ElevenLabs are.
- **Vercel Firewall** — platform-level rate limiting in front of `/api/contact`, `/api/agent/session`, and `/api/agent/turn`.

## Module boundaries

- Content/UI code never talks to Supabase, Resend, Deepgram, ElevenLabs, or Anthropic directly — only through the Route Handlers above.
- The voice-agent knowledge base is built from the same versioned repo content that renders the About/Experience/Projects/Case-studies sections (PRD §10) — never a separate, unverified fact source, and never crawled/user-submitted content.
- The contact-form and voice-agent Route Handlers are independent modules; they share the Supabase client and environment-variable conventions but own separate tables and separate failure-handling logic.
- `/api/agent/session` (token minting) and `/api/agent/turn` (the LLM call + guardrail check) are deliberately separate Route Handlers with different credential scopes — `/api/agent/session` never touches `ANTHROPIC_API_KEY`, and `/api/agent/turn` never touches `DEEPGRAM_API_KEY` or the ElevenLabs key. Keeping this split narrows the blast radius of a credential leak in either handler.

## Data ownership

| Data | Owner | Notes |
|---|---|---|
| Static site content (roles, projects, case studies, resume) | Repo (versioned Markdown/MDX or structured data files) | Source of truth for both the rendered site and the agent's knowledge base |
| Contact submissions (name, email, message, delivery status) | Supabase Postgres, `apps/web` backend | PII; least-privilege access (Gaurav only) |
| Voice-agent session metadata (timestamp, duration, turn count, mode, cap-hit flag, estimated cost) | Supabase Postgres, `apps/web` backend | PII once linked to a session; no conversation content stored here |
| Live conversation history (transcript + LLM turns for an in-progress session only) | Supabase Postgres or a short-TTL cache, `apps/web` backend | Held only for the duration of the live session; deleted at `POST /api/agent/session/end` (natural end or cap-triggered). Zero retention beyond the live session by default (ADR-001 D7, amended) — this is a deliberate tightening versus the originally-planned 30-day window, since there is no vendor platform managing retention anymore |
| Analytics events (page view, scroll depth, CTA click) | Analytics tool (OQ-004, not yet chosen) | No PII beyond what a user voluntarily submits elsewhere |

## Primary flows

### Contact-form submission (FR-003, J-4)

1. Visitor fills name/email/message client-side; client-side validation blocks obviously invalid input (AC-003).
2. Submit → `POST /api/contact`. Vercel Firewall rate-limit rule evaluates the request first.
3. Route Handler re-validates server-side (independent of client validation, AC-003) and checks the honeypot field.
4. Route Handler checks Supabase for a recent duplicate (same email+message hash within a short window) to block rapid re-submits (AC-006).
5. Route Handler inserts a row into Supabase with `delivery_status = pending`.
6. Route Handler calls Resend to send the notification email.
7. On Resend success → update row to `delivered`, return success to the client (AC-004).
8. On Resend failure → update row to `failed`, return an explicit error to the client with mailto/Calendly alternates surfaced (NFR-005, AC-005). The submission is never lost silently — it's already durably recorded in step 5.

### Voice/text agent conversation (FR-013, J-5) — DIY hybrid pipeline

1. Visitor opens the agent widget → client requests `POST /api/agent/session`.
2. Vercel Firewall rate-limit rule evaluates the request.
3. Route Handler checks the app-level daily/monthly cost throttle (ADR-001 D6, amended) against Supabase-tracked estimated spend. If under budget: mints a Deepgram temporary token and an ElevenLabs TTS single-use token, and creates a session record (session ID, start timestamp). If the daily budget is already hit: still creates a text-only session (no Deepgram/ElevenLabs tokens needed) rather than refusing outright — graceful degradation, never a hard failure. If the monthly hard ceiling is hit: refuses new sessions and returns the "temporarily unavailable" state.
4. **Voice mode:** the browser connects directly to Deepgram's streaming STT WebSocket using its token and streams microphone audio; Deepgram returns interim/final transcripts. On each finalized user utterance, the browser sends the transcript text (not audio) to `/api/agent/turn`.
   **Text mode:** the browser sends typed text straight to `/api/agent/turn`, skipping Deepgram entirely.
5. `/api/agent/turn` (the one mandatory server-mediated hop, identical for both modes): loads the session's conversation history and the versioned knowledge-base content, constructs the full prompt (system prompt + RAG context + history + new turn), and calls Claude Haiku via the Anthropic Messages API, streaming the response. The custom guardrail classifier (ADR-001 D8, amended) checks the response before it's considered final — this is where grounded answers (AC-014) and in-character adversarial deflection (AC-015) are enforced, since there is no vendor guardrail product doing this natively. The elapsed-time/turn-count check (ADR-001 D5, amended) runs here too; if the cap is hit, the response is reframed as the graceful wrap-up (AC-016).
6. The (guardrail-passed) response streams back to the browser as plain text via standard Vercel HTTP streaming.
7. **Voice mode only:** the browser forwards the streamed response text to ElevenLabs' TTS WebSocket using its token, synthesizing Gaurav's cloned voice, and plays the audio as it arrives.
   **Text mode:** the browser renders the streamed text directly — no further hop.
8. This repeats each turn (steps 4–7) until the session ends naturally or the cap triggers (AC-016), at which point the client calls `POST /api/agent/session/end`, which records final session metadata to Supabase (duration, turns, mode, cap-hit flag, estimated cost — never conversation content) and deletes the transient conversation-history record.
9. If the Deepgram or ElevenLabs connection fails or is unavailable, the client falls back to an explicit "temporarily unavailable — here's how to reach me" state surfacing the contact CTAs, never a silent dead widget (PRD §9 UX states table). If only the voice legs fail, the client can offer to continue in text mode instead (mic permission denied follows the same path, per NFR-008 parity).

## Trust boundaries

- Browser ↔ `/api/contact`: untrusted visitor input; validated and sanitized server-side; never rendered unescaped anywhere (NFR-003).
- Browser ↔ `/api/agent/session`: untrusted visitor request for a session; server enforces rate limiting and the cost throttle before minting any token.
- Browser ↔ Deepgram (direct, post-token): untrusted visitor audio; Deepgram only transcribes — it never sees the system prompt or the knowledge base, so this leg carries no prompt-injection risk on its own. `DEEPGRAM_API_KEY` never reaches the browser.
- Browser ↔ ElevenLabs TTS (direct, post-token): outbound only (text-to-speech) — no untrusted input flows into ElevenLabs from this leg; the API key never reaches the browser.
- Browser (transcript/typed text) → `/api/agent/turn` → Anthropic Messages API: this is **the** prompt-injection trust boundary. All visitor input — voice-transcribed or typed — reaches the LLM here, and is untrusted per `.claude/rules/security.md`. Unlike the original design, there is no vendor guardrail product backing this boundary — the custom guardrail classifier (ADR-001 D8, amended) is the entire mitigation, and `ANTHROPIC_API_KEY` is structurally server-side-only since Claude has no client-token mechanism.
- `/api/contact`, `/api/agent/session`, `/api/agent/turn` ↔ Supabase: trusted server-to-server, service-role credentials, server-side only.
- `/api/contact` ↔ Resend, `/api/agent/session` ↔ Deepgram/ElevenLabs (token-mint only), `/api/agent/turn` ↔ Anthropic: trusted server-to-server, API keys server-side only, sourced from Vercel environment variables, never logged or committed (NFR-003, AC-012, AC-018).

## Failure modes

| Failure | Handling |
|---|---|
| Resend unreachable/errors | Contact submission already persisted in Supabase as `pending`→`failed`; explicit user-facing error + mailto/Calendly fallback (AC-005) |
| Supabase unreachable | Contact form and agent endpoints fail closed with an explicit error state (never a silent 200 that drops data) |
| Deepgram or ElevenLabs token-mint fails | Client shows "temporarily unavailable" state with contact CTAs, or offers text-only mode if only the affected leg is needed, never a broken/frozen widget |
| Deepgram or ElevenLabs live connection drops mid-conversation | Client offers a reconnect, a fallback to text mode, or a graceful "here's how to reach me" state, per PRD §9 |
| Anthropic Messages API call fails or times out (`/api/agent/turn`) | Explicit error surfaced to the client for that turn; does not silently drop the user's message — offers retry or the contact-CTA fallback if repeated |
| Daily cost throttle hit | New sessions degrade to text-only mode rather than failing (ADR-001 D6, amended) |
| Monthly cost ceiling hit | Hard stop — new sessions (voice and text) refuse outright with the "temporarily unavailable" fallback, since there is no vendor-level spend cap to have already caught this upstream (ADR-001 D6, amended) |
| Guardrail classifier flags a response | Response is replaced with an in-character deflection before it reaches the browser/TTS (ADR-001 D8, amended); repeated flags in one session trigger the graceful wrap-up early |
| Contact-form duplicate/bot submission | Rejected server-side via Vercel Firewall rate limit, honeypot check, and Supabase duplicate-hash check (AC-006) |
| Mic permission denied | Client offers text mode immediately (parity by design, NFR-008) |

## Timeouts and retries

- `/api/contact`: single Resend send attempt per request; no automatic retry (the durable Supabase record enables manual/administrative retry later without re-prompting the user). Client does not auto-retry a failed submission; the user is shown the alternate contact paths instead.
- `/api/agent/session`: Deepgram/ElevenLabs token-mint calls use a short timeout (a few seconds); on timeout/error, return an explicit failure to the client rather than hanging.
- `/api/agent/turn`: the Anthropic Messages API call is streamed; a per-request timeout bounds worst-case latency, with an explicit error surfaced to the client on timeout rather than an indefinite spinner.
- Deepgram temporary token: only needs to be valid for the initial WebSocket handshake (per Deepgram's token model); the connection then stays open independently of the token's own TTL.
- ElevenLabs TTS single-use token: expires in 15 minutes — a session that isn't started promptly after minting must request a new token.

## Idempotency

- Contact-form duplicate/spam prevention uses a content-hash + time-window check against Supabase before insert (AC-006) — acts as the idempotency key for this endpoint.
- Voice-agent session-metadata writes (`/api/agent/session/end`) are keyed by the server-generated session ID, safe to upsert if a client retries a metadata report.
- The session-cap check in `/api/agent/turn` (elapsed time and turn count) is computed server-side from the session record on every call, not trusted from client-reported values — this makes it safe against a client retrying a turn and also closes off client-side manipulation of the cap (ADR-001 D5, amended).

## Observability

- Contact-form: log submission outcome (success/failure/duplicate-rejected) without logging full message bodies beyond what's needed operationally (PRD §11).
- Voice agent: log session start/end, duration, mode, cap-hit flag, and estimated cost per session (Supabase) to power the daily/monthly cost dashboards and alerting thresholds in ADR-001 D6 (amended) — never conversation content.
- Guardrail classifier: log flag/pass outcomes per turn (pass/flag, category if flagged) — without logging the flagged content itself unless a specific incident investigation is deliberately opened — to give the security-gate reviewer production evidence that the classifier is firing as expected, per ADR-001 D8's requirement for adversarial evidence, not just a code review.
- Alerting at 50/80/100% of the daily ($5) and monthly ($60) cost figures (ADR-001 D6, amended).

## Deployment

- Single Vercel project for `apps/web`. Environment variables (`DEEPGRAM_API_KEY`, `ELEVENLABS_API_KEY` (TTS-scoped), `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, Supabase service-role key) are configured in Vercel's environment settings, never committed.
- Voice-cloning setup (Instant/Professional Voice Cloning of Gaurav's voice, from OQ-011's voice sample) is done once in the ElevenLabs account/dashboard — this is account configuration, not code, and is a deployment-stage dependency rather than something that ships via a PR merge.
- Production cutover of the live `gauravchaulagain.com` domain, and the Resend sending-domain DNS record, both require explicit human approval before change (`.claude/rules/security.md`).

## Migration and rollback

- This is a from-scratch build; there is no data migration from the currently-live site (it is not being migrated, per the task framing).
- Rollback for the voice agent: the widget can be feature-flagged off (falling back to the "temporarily unavailable, here's how to reach me" state) independently of the rest of the site shipping, since it's an isolated client component talking to isolated Route Handlers.
- Rollback for the contact form: Resend/Supabase failures degrade to the always-present mailto/Calendly links (FR-002), so the form is never a single point of failure for the contact journey.

## Known debt

- Analytics tool choice (OQ-004) is not yet decided; FR-012 instrumentation is not yet designed in this document.
- The custom guardrail classifier (ADR-001 D8, amended) is not yet designed or implemented — this is now the highest-priority piece of new engineering for FR-013 and needs its own adversarial-eval pass before the security-gate review, not just a prompt addition.
- Session-cap enforcement (ADR-001 D5, amended) is now fully custom for both voice and text mode (no native platform cap of any kind) and is not yet implemented.
- The choice of storage mechanism for live conversation history (Supabase table vs. a short-TTL cache, ADR-001 D7 amended) is not yet decided — flagged as an implementation detail to resolve early, since it affects both `/api/agent/turn`'s latency and the deletion-on-session-end guarantee.
- The exact DIY blended cost estimate (~$0.02–0.04/min) needs re-verification against ElevenLabs' standalone TTS per-character pricing (as opposed to the Agents Platform's bundled rate the original research focused on) before the daily/monthly ceilings (ADR-001 D6, amended) are treated as final.
- The exact daily/monthly cost-ceiling dollar figures (ADR-001 D6, amended: $5/day, $60/month) are a proposed default pending Gaurav's confirmation.
- Content-completion pass (OQ-001) is unresolved; this document describes structure, not final copy/data.

## Related ADRs

- `ADR-001`: apps/web stack, hosting, and voice-agent provider (`docs/30-engineering/ADR/001-web-stack-and-voice-agent-provider.md`) — see its 2026-07-24 amendment banner for the D2 reversal (DIY pipeline chosen over ElevenLabs Agents Platform) that this document reflects.
