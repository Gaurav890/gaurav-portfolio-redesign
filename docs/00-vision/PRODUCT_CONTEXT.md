# Product context

## Background

Gaurav Chaulagain is a Technical Product Manager working in LLMs, AI agents, and agentic systems (currently Technical Project Manager at FleetPanda; prior roles at fAIshion Inc., WP Creative, Hazesoft, and Blind Women Association of Nepal). He has an existing live portfolio at `gauravchaulagain.com` (Next.js + Tailwind + Framer Motion) that this project fully rebuilds. See the 2026-07-24 live-site audit captured this session (screenshots in `.playwright-mcp/`) for the as-is baseline: current IA is Hero → About → Experience → Featured Projects → Case Studies → Education → Achievements → Community → Contact.

## Market/context

Candidates for technical PM / AI product roles are increasingly numerous and increasingly templated (AI-assisted resume sites, generic portfolio builders). A hiring manager evaluating many similar profiles decides fast; differentiation now has to come from both substance (quantified, verifiable outcomes) and presentation (a site that feels authored, not templated).

## Existing workflow

Today, a hiring manager or recruiter finds the site via a resume link, LinkedIn, or direct search, and skims a single long-scroll page. There is no dedicated resume artifact flow, no structured contact-form backend, and no analytics instrumentation confirmed in place.

## Constraints

See `NORTH_STAR.md` § Immutable constraints. Additional working constraints:
- Rebuild happens inside this monorepo's `apps/web` (currently an empty placeholder) — see `docs/30-engineering/ARCHITECTURE.md` for the chosen stack once decided.
- Contact form requires a real backend path (server-side validation, spam/abuse protection, delivery) per the 2026-07-24 product decision — this is in scope, not deferred.

## Known dependencies

- Domain `gauravchaulagain.com` (production cutover requires explicit human approval per this repo's security rules).
- A resume PDF artifact must exist/be produced for the download CTA.
- Content-completion pass: several content sections are flagged for revision/expansion by Gaurav before copy can be finalized (see `docs/10-product/OPEN_QUESTIONS.md`).
- Choice of email-delivery provider and spam-protection mechanism for the contact form (open — see Open Questions).

## Vocabulary

See `GLOSSARY.md`.
