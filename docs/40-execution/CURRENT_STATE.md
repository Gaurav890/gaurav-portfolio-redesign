# Current state

Last updated: 2026-07-24

## Product

`apps/web` is an empty placeholder. No application code has been written yet for this rebuild. Architecture/ADR work is ahead of implementation.

## Web

Stack decided, not yet implemented: Next.js (App Router) + TypeScript + Tailwind + Framer Motion, deployed on Vercel. See `docs/30-engineering/ADR/001-web-stack-and-voice-agent-provider.md`.

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

No code exists yet, so no verification has run.

## Known incomplete work

- OQ-001 (content-completion pass), OQ-005 (resume PDF currency), OQ-011 (voice sample for cloning) remain open and are prerequisites for implementation, not resolved by this session.
- OQ-015's exact cost-ceiling dollar figures ($5/day, $60/mo proposed) are pending Gaurav's explicit confirmation (see `ADR-001` D6 amended and open follow-ups).
- OQ-016 (default LLM: Claude Haiku recommended) remains open per Gaurav's "decide during implementation."
- The custom guardrail classifier required by `ADR-001` D8 (amended) is not yet designed — this is now the highest-priority new engineering task for FR-013.
- OQ-004 (analytics tool) remains open and non-blocking.
- No application code, tests, or deployments exist yet for this rebuild.

Only factual present-tense truth belongs here.
