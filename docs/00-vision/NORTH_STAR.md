# North star

## Product

A personal portfolio site for Gaurav Chaulagain that lets his real shipped work, quantified outcomes, and personal voice do the convincing — anchored by a voice-cloned conversational AI agent visitors can actually talk to — so a hiring manager can go from first visit to "I want to talk to this person" in one sitting, and remembers the site as a new benchmark for what a portfolio can be.

## User

Hiring managers and recruiters evaluating Gaurav for full-time technical product manager / AI product roles (LLMs, AI agents, agentic systems). They are time-pressured, skim first, and decide fast whether to invest attention in a candidate.

## Pain

The current site (gauravchaulagain.com) has genuinely strong underlying material — $1.7M+ in contract value delivered, a Cal Hacks 12.0 "Best Use of Claude" win, multiple live production AI projects, quantified case study results (+18% conversion, +100% organic traffic, +619% traffic growth) — but presents it through a generic template: minimal color/brand identity, uneven whitespace, no visual signal that this is someone who builds AI agentic systems, and a bolted-on chatbot widget that doesn't fit. All the craft is in the copy; none of it is in the interface. Against other candidates with similar bullet points, it doesn't differentiate or stick in memory.

## Desired outcome

A rebuilt site with a warm, narrative visual thesis — personal, story-led, voice-forward — that rewards a fast skim and a deep read equally: scannable enough to de-risk a hiring decision in 60 seconds, rich enough that a recruiter remembers and forwards it internally. It should offer every reasonable path to action (book a call, email, download resume) without forcing a single funnel.

## Immutable constraints

- This is a single personal-brand site for Gaurav, not a company/product site — never dilute it into a generic "services" or SaaS-demo layout.
- Every fact presented (roles, dates, numbers, project claims) must come from Gaurav — never fabricate, estimate, or embellish a metric or claim during the content-revision pass. This includes the voice agent: it must never invent or embellish a claim about Gaurav's background.
- Secrets for any backend service (contact-form email delivery, spam protection, analytics, voice/LLM provider) are never exposed client-side or committed to the repo.
- No destructive change to the live production domain without explicit approval before cutover.

## Success signal

An increase in qualified inbound contact attributable to the site — calls booked via Calendly, emails sent, resume downloads — plus qualitative signal from real hiring conversations ("this is the best portfolio I've seen" or equivalent unprompted feedback) and evidence of internal forwarding/sharing. A secondary signal specific to the voice agent: visitors who converse with it and then take a contact action after the session wraps up, confirming the "impress, then convert" design works as intended.

## Anti-goals

- Not a blog platform or CMS-driven publishing product.
- Not primarily optimized for enterprise/consulting sales leads (secondary audience at most — see `docs/10-product/PRD.md`).
- Not a generic gradient-heavy dashboard-style resume site.
- Not a multi-tenant or templated product other people could reuse — this is bespoke to Gaurav's brand.
