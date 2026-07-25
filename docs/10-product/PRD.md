# Product requirements document

Status: Draft — locked decisions below; content-completion pass still pending (see Open Questions)

## 1. Problem

The current portfolio site presents genuinely strong, quantified professional material through a generic, low-differentiation template. Hiring managers evaluating technical PM / AI-agent candidates skim fast; a site that doesn't visually signal craft and personality fails to convert attention into a conversation, no matter how strong the underlying facts are.

## 2. Desired outcome

A fully rebuilt personal site with a warm, narrative visual thesis that lets a hiring manager verify credibility and personality within seconds, rewards a deeper read, and offers every reasonable path to follow-up action without funneling toward just one.

## 3. Users/personas

See `docs/00-vision/PERSONAS.md`. Primary: P-001 hiring manager/recruiter. Secondary, non-optimized-for: P-002 enterprise/consulting prospect.

## 4. Jobs to be done

- JTBD-1: As a hiring manager, verify in under a minute that Gaurav has shipped real, quantified outcomes relevant to the role I'm hiring for.
- JTBD-2: As a hiring manager, understand what kind of PM/operator Gaurav is (voice, values, working style) beyond a bullet-point resume.
- JTBD-3: As a hiring manager, take a low-friction next action (book time, email, grab the resume) without hunting for contact info.
- JTBD-4: As a hiring manager, forward or reference this site internally to a colleague without it looking like a generic template.
- JTBD-5: As a hiring manager, ask a voice/text AI agent (cloned in Gaurav's voice) direct questions about his experience and get grounded, charismatic answers as if talking to Gaurav himself.

## 5. User journeys

### J-1: Fast skim → book a call (happy path)
Trigger: Recruiter opens link from a resume or LinkedIn.
Starting state: Cold, no prior context.
Happy path: Hero communicates identity + role framing + top credibility stats within first viewport → recruiter scrolls narrative About → skims Experience/Projects → clicks "Book a call."
Alternate path: Recruiter jumps straight to Contact via nav instead of scrolling.
Recovery path: If Calendly embed fails to load, a direct scheduling link/email fallback is visibly available, not hidden behind a broken widget.
Terminal state: Call booked, or email drafted, or resume downloaded.

### J-2: Deep read before an interview loop
Trigger: Recruiter/hiring panel revisits the site before an onsite/interview to prep questions.
Starting state: Warm — already familiar with Gaurav at a high level.
Happy path: Navigates directly to Case Studies/Projects for depth, reads full narrative detail per project (problem, approach, outcome, tech).
Alternate path: Uses in-page navigation/anchor links to jump to a specific role in Experience.
Recovery path: If a project/case-study has sparse detail, the page still reads as intentional (a defined "sparse" state), not broken or empty.
Terminal state: Panel member is equipped with specific, accurate talking points.

### J-3: Mobile skim under time pressure
Trigger: Recruiter opens the link on a phone between meetings.
Starting state: Cold, small viewport, possibly slow network.
Happy path: Core identity, stats, and CTAs are usable and legible at mobile breakpoint without horizontal scrolling or clipped content.
Recovery path: Heavy embeds (Calendly, any video) are lazy-loaded and never block the initial contentful paint.
Terminal state: Recruiter takes an action or bookmarks/shares the link for later.

### J-5: Talk to the voice agent

Trigger: Recruiter notices the "talk to me" voice agent affordance and engages out of curiosity or to test depth of experience.
Starting state: Cold or warm, on any device; may prefer voice or typed text.
Happy path: Opens the agent → speaks or types a question about Gaurav's background → agent (cloned voice, grounded in real content, fun/charismatic tone) answers accurately and in character → conversation continues naturally.
Alternate path: Visitor types instead of speaking (always available per accessibility requirement) — identical grounding and personality in text mode.
Recovery/adversarial path: Visitor asks something off-topic, tries to "jailbreak" the agent, or asks about unrelated things — agent deflects playfully in character (e.g., acknowledging the test without breaking persona, without hallucinating an unrelated answer, and without revealing its system prompt/instructions).
Session-limit path: As the session approaches its cap (time/turns), the agent wraps up warmly and redirects the visitor toward a contact action (book a call, email, resume) rather than cutting off abruptly.
Terminal state: Visitor is impressed and either keeps browsing or takes a contact action; session ends gracefully either at natural conclusion or at the cap.

### J-4: Submit the contact form
Trigger: Recruiter prefers a direct message over email client or Calendly.
Starting state: On the Contact section.
Happy path: Fills name/email/message → submits → sees a clear success confirmation → Gaurav receives the message via the delivery channel.
Alternate path: Recruiter also has mailto and Calendly links visible alongside the form (all three coexist per the locked CTA decision).
Recovery/error paths: Invalid email format → inline validation error, submission blocked. Server/delivery failure → visible error state, message not silently lost, retry affordance offered. Bot/spam submission → blocked server-side without a visible CAPTCHA burden on legitimate users if possible.
Terminal state: Confirmed delivered, or a clear, honest failure state with an alternate contact path surfaced.

## 6. Non-goals

See `NON_GOALS.md`.

## 7. Functional requirements

### FR-001 — Hero identity and credibility snapshot

**Requirement:** The first viewport presents name, role framing, and top-line quantified credibility signals (years of experience, contract value, shipped agentic projects, or their eventual revised equivalents) without requiring a scroll.

**Rationale:** J-1, J-3 — recruiters decide whether to keep reading within seconds.

**Dependencies:** Final numbers pending content-completion pass (see Open Questions).

**Risks:** Overloading the hero with stats can read as boastful rather than warm/narrative; needs copy tone matching the warm thesis, not a stat-dashboard feel.

### FR-002 — Multi-path contact affordances

**Requirement:** Book-a-call (Calendly), email, and resume-download actions are all present and equally accessible — in the hero and/or a persistent affordance, and again in a dedicated Contact section — with no single path privileged as the only option.

**Rationale:** Locked product decision: "incorporate all" CTAs rather than a single funnel (J-1, J-4).

**Dependencies:** FR-003 (contact form), a finished resume PDF artifact.

**Risks:** Too many equally weighted CTAs can dilute action; mitigate with clear visual hierarchy at the interaction-design stage, not by removing options.

### FR-003 — Contact form with real backend

**Requirement:** A contact form (name, email, message) submits to a server-side endpoint that validates input, applies spam/abuse protection, and delivers the message to Gaurav, in addition to (not instead of) the mailto/Calendly links.

**Rationale:** Locked product decision: "both please" — form and links coexist (J-4).

**Dependencies:** Choice of email-delivery provider and spam-protection mechanism — see OQ items. Architecture/security review required before implementation per `docs/30-engineering/` and `.claude/rules/backend.md`.

**Risks:** Real backend increases attack surface (spam, injection, abuse) — must go through `security-gate` before merge.

### FR-004 — Resume download

**Requirement:** One-click resume download (PDF) available from at least the hero and Contact section.

**Rationale:** Locked CTA decision; JTBD-3.

**Dependencies:** Current resume PDF artifact must exist and be current — confirm with Gaurav before launch.

**Risks:** Stale resume PDF contradicting on-page content if not kept in sync.

### FR-005 — Narrative About section

**Requirement:** An About section conveys personal voice and story (not just a role/company list) — origin, motivation, working principles, at least one concrete anecdote — consistent with the warm/narrative visual thesis.

**Rationale:** JTBD-2; locked visual-thesis decision.

**Dependencies:** Content-completion pass — confirm which anecdotes/voice details to keep, revise, or add.

### FR-006 — Experience section

**Requirement:** Each role presents company, title, dates, location, and narrative-framed accomplishments with quantified outcomes where available.

**Rationale:** J-1, J-2, JTBD-1.

**Dependencies:** Content-completion pass on quantified outcomes per role.

### FR-007 — Featured projects section

**Requirement:** Each featured project presents problem, approach, outcome, tech stack, and an external link where one exists. Confirmed project list (2026-07-24 content pass): ELDA.AI, Aakha.org, NepalElection.chat, **vocal-stack** (open-source npm library for production voice AI agents — speech sanitizing, flow control, latency auditing; published on npm, on GitHub), **AquaOracle** (terminal-based local RAG platform for water-safety/regulatory compliance; fully local four-stage retrieval pipeline, on GitHub), and **Dr. Birkhe** (bilingual Nepali-English health chatbot, winner of Nepal's Rising Student ICT Award — the anchor story of the About section per `COPY.md`; confirmed as a 6th featured project 2026-07-24).

**Rationale:** J-2, JTBD-1.

**Dependencies:** Content-completion pass — resolved for all six projects. Dr. Birkhe needs project-detail content (links, tech stack, more outcome detail) gathered from Gaurav, since it was previously only described narratively.

### FR-008 — Case studies section — REMOVED (2026-07-24)

**Status:** Cut from scope. Gaurav confirmed the case studies section ("AI fashion trust/conversion," "real-estate SEO," "HR SaaS traffic") is "not helpful right now" and should not carry into the rebuild. See `NON_GOALS.md` NG-008. Retained here only for traceability — do not implement.

### FR-014 — Events section

**Requirement:** A section showing events Gaurav has attended (e.g. hackathons, conferences, meetups) and events he plans to attend, giving a sense of an active, ongoing presence rather than a static snapshot.

**Rationale:** New content direction from the 2026-07-24 content-completion pass — reinforces JTBD-2 (personality/momentum) and gives recruiters a sense of current activity, not just historical achievement.

**Dependencies:** Content-completion pass — specific event list needed from Gaurav (see `OPEN_QUESTIONS.md` OQ-014).

### FR-015 — Personal/candid writing section ("Notes")

**Requirement:** A lightweight, personal-voice writing section on the site itself — candid thoughts, opinions, and reflections, distinct in tone and purpose from the existing professional Medium blog (which stays external and linked, not rebuilt — see `NON_GOALS.md`). Modeled in spirit (not copied) on the candid, mixed technical/personal tone of reference sites like prashish.xyz. Posts are versioned content (e.g. MDX/markdown files in the repo), not a runtime CMS, consistent with `NON_GOALS.md` NG-005. Confirmed 2026-07-24: explicitly optimized to be discovered and followed — needs tags, an RSS feed, SEO (structured data, sitemap entries, social/OG meta per post), and reader comments with spam validation.

**Rationale:** New content direction — Gaurav wants this to build a real following (organic/Google discovery, RSS subscribers, on-page comments), not just exist as a quiet corner of the site.

**Dependencies:** Launch structure confirmed as: list + detail pages, tags, RSS feed, comments (spam-validated, not open-moderation-free — see `OPEN_QUESTIONS.md` OQ-018 for the comment-moderation policy still needed). Naming still open (OQ-012, non-blocking). First posts need to be authored — not a launch blocker for the rest of the site (an empty/sparse "Notes" section with a "more soon" state is an acceptable initial launch state per the sparse-state design bar); tags/RSS/comments should still be structurally in place even if post count is low.

**Risks:** Comments are user-generated content rendered publicly to other visitors — a different and larger trust boundary than the contact form (that data only reaches Gaurav; this data reaches every site visitor). Requires the same never-render-unescaped-content and spam/abuse protection discipline as the contact form, plus a moderation-policy decision (see OQ-018) before this ships, per `.claude/rules/security.md` and `.claude/rules/backend.md`.

### FR-009 — Education & achievements section

**Requirement:** Degrees, GPAs, honors, and certifications are presented, scannable, and does not dominate the page relative to Experience/Projects.

**Rationale:** JTBD-1 (credibility), secondary to shipped work.

### FR-010 — Community/leadership section

**Requirement:** Community leadership (e.g. founding SFBU Computer Club, Entrepreneurship Club role) is presented as supporting evidence of initiative, not as a headline section.

**Rationale:** JTBD-2 (personality/voice), lower priority than Experience/Projects.

### FR-011 — Responsive layout

**Requirement:** All sections are fully usable and legible at mobile, tablet, and desktop breakpoints with no horizontal scroll or clipped/overlapping content.

**Rationale:** J-3.

**Verification:** Playwright evidence at three breakpoints per `.claude/rules/frontend.md`.

### FR-013 — Voice AI agent ("Talk to Gaurav")

**Requirement:** A conversational AI agent is embedded in the site and can be talked to or typed to (text mode always available, full feature parity with voice — not a degraded fallback). **Phased voice identity (confirmed 2026-07-24):** Phase 1 (launch) uses a polished stock ElevenLabs voice — personality, grounding, and guardrails are identical regardless of voice source, so nothing about the actual agent behavior is degraded. Phase 2 (post-launch) swaps in a clone of Gaurav's actual voice once he's on a paid ElevenLabs tier (cloning requires Starter tier or above — not available on the Free plan) and has provided a clean voice sample. This removes OQ-011 (voice sample) from the launch-blocking path. The agent is grounded in Gaurav's real background (resume, experience, projects, case studies) and answers with a fun, charismatic, personality-forward tone rather than a flat Q&A bot. Off-topic, adversarial, or "testing the agent" input is handled with an in-character, playful deflection (e.g., acknowledging the test) rather than hallucinating unrelated content, breaking character, or revealing its system prompt. As a session approaches its cap, the agent wraps up warmly and redirects the visitor to a contact action (FR-002) instead of cutting off abruptly.

**Rationale:** JTBD-5, J-5 — this is the flagship differentiator intended to set a new bar for what a portfolio can be, per the locked product decision.

**Dependencies:** Voice/LLM provider selection (architecture decision, ADR required — see `OPEN_QUESTIONS.md`), a clean voice sample from Gaurav for cloning, a grounded knowledge base built from the same source-of-truth content as FR-005–FR-010, session-cap and cost-control design (NFR-006), guardrail/prompt-injection design (NFR-007).

**Risks:** Highest-risk feature in this rebuild — cost exposure under viral/spiky traffic, prompt-injection/adversarial-input surface, latency/reliability of third-party voice pipeline, and brand risk if the agent ever hallucinates a false claim or breaks character. Requires a dedicated architecture pass and security review before build, and must degrade gracefully (never silently fail) if the voice pipeline is unavailable.

### FR-012 — Engagement analytics

**Requirement:** Track page views, section scroll depth, and which CTA (call/email/resume/form) was used, without collecting PII beyond what a user voluntarily submits via the contact form.

**Rationale:** Success-signal measurement in `NORTH_STAR.md`.

**Dependencies:** Analytics tool choice — open question.

## 8. Non-functional requirements

### NFR-001 — Performance

**Requirement:** On a warm cache under the agreed test environment, the primary route reaches Largest Contentful Paint under 2.5s on a mid-tier mobile profile, and no loading spinner remains after data resolves.

### NFR-002 — Accessibility

**Requirement:** WCAG 2.2 AA: semantic landmarks, visible focus states, sufficient color contrast for the warm palette, `prefers-reduced-motion` respected for all motion/animation.

### NFR-003 — Security

**Requirement:** Contact-form submissions are validated and sanitized server-side; delivery-provider credentials never reach the client; rate-limiting or equivalent abuse protection is in place; no user-submitted content is ever rendered unescaped.

### NFR-004 — SEO/discoverability

**Requirement:** Correct meta/OG tags, sitemap, and Person structured data so that a name search surfaces the site accurately.

### NFR-005 — Reliability of contact paths

**Requirement:** Contact-form failures (network, validation, delivery) are surfaced to the user explicitly; no submission is silently dropped without either a success or a clear failure state.

### NFR-006 — Voice agent cost control

**Requirement:** Each conversation session has an explicit cap (duration and/or turn count); a global daily/monthly spend ceiling exists with monitoring; hitting either limit degrades gracefully into the warm wrap-up + contact-CTA redirect (FR-013), never a silent failure or abrupt disconnect.

### NFR-007 — Voice agent guardrails and prompt-injection resistance

**Requirement:** All visitor voice/text input to the agent is treated as untrusted input at a trust boundary, per `.claude/rules/security.md`. The agent must never reveal its system prompt/instructions, never fabricate a claim about Gaurav's background, and must handle adversarial or off-topic input with a defined in-character deflection rather than an unconstrained response.

### NFR-008 — Voice agent accessibility parity

**Requirement:** Text-chat mode offers full functional parity with voice mode at all times — same grounding, same personality, same guardrails — so the experience meets NFR-002 (WCAG 2.2 AA) for users who cannot or prefer not to use audio.

## 9. UX states

| Flow | Loading | Empty | Sparse | Dense | Invalid | Error | Disabled | Success |
|---|---|---|---|---|---|---|---|---|
| Hero/page load | Fast static render, no spinner if avoidable | N/A — always populated | N/A | N/A | N/A | Failed embed (Calendly) shows fallback link | N/A | Fully rendered above the fold |
| Projects | Skeleton only if data is fetched at runtime | N/A (always has content) | Fewer than 3 items still reads as intentional, not broken | 6+ items uses pagination/scroll, not cramped grid | N/A | Missing project image falls back to a defined placeholder | N/A | All items rendered with consistent card treatment |
| Events (FR-014) | N/A (static content) | No upcoming events yet reads as an intentional "nothing planned right now" state, not broken | 1-2 events still reads as intentional | Many events uses a scrollable timeline, not a cramped list | N/A | N/A | N/A | Past and upcoming events both rendered with clear date framing |
| Notes / personal writing (FR-015) | N/A (static content, or skeleton if list is fetched) | Zero posts shows a "more soon" empty state, not a broken-looking blank section | 1-2 posts still reads as intentional | Many posts uses pagination, not one long scroll | N/A | N/A | N/A | List + detail pages render consistently |
| Contact form | Submit button shows pending state | N/A | N/A | N/A | Inline field-level validation error | Delivery/network failure shows explicit error + alternate contact path | Submit disabled while pending or after one successful submit (anti-duplicate) | Clear on-page success confirmation |
| Resume download | N/A | N/A | N/A | N/A | N/A | Missing/broken file shows an explicit error, not a silent 404 | N/A | File downloads, optionally tracked |
| Voice agent | Visible "connecting" state while the voice/LLM session initializes | Initial prompt/greeting before visitor speaks or types | Short conversation (1-2 turns) still feels complete, not cut off | Long conversation scrolls/manages transcript cleanly without performance degradation | Empty text-input submit is blocked client-side | Mic permission denied, connection drop, or provider outage shows an explicit fallback (switch to text, or a clear "temporarily unavailable, here's how to reach me" state) | Input disabled while the agent is mid-response (no overlapping turns) | Natural conversation end, or graceful cap-triggered wrap-up redirecting to contact CTAs |

## 10. Data requirements

- Contact-form submissions: name, email, message. Treated as PII — see Security below. Storage (if any) vs. pass-through-only delivery is an open architecture decision.
- Analytics events: page view, scroll-depth milestones, CTA-click type. No PII beyond voluntary form submission.
- Static content: roles, projects, case studies, education, achievements, community — sourced from Gaurav, versioned in the repo (not a runtime CMS unless a later ADR changes that).
- Voice agent knowledge base: built from the same versioned source-of-truth content as the rest of the site (never a separate, unverified fact source).
- Voice agent conversation data: whether transcripts/audio are logged or persisted (for QA, abuse monitoring, or cost tracking) vs. kept ephemeral is an open architecture decision with direct privacy implications — see `OPEN_QUESTIONS.md`.

## 11. Security and privacy

- Trust boundary: browser → contact-form API route → email-delivery provider (and optional storage). Delivery-provider API keys are server-side only, sourced from environment variables, never logged or committed.
- Abuse cases: automated spam submissions, email-header injection via form fields, XSS via message content if ever rendered elsewhere (e.g., an admin view) — must be sanitized/escaped, never rendered as raw HTML.
- Must never log full message bodies in a way that leaks into shared/observable logs beyond what delivery requires.
- Any destructive change to the production domain or DNS requires explicit human approval per `.claude/rules/security.md`.
- Voice agent trust boundary: browser (mic/text input) → voice/LLM provider session, mediated by a server-side session broker that holds provider credentials (never exposed client-side) and enforces the session cap (NFR-006). All visitor input is untrusted per `.claude/rules/security.md` — threat-model prompt injection explicitly (attempts to extract the system prompt, override grounding, or induce off-brand/false claims) as part of the pre-merge security review for this feature.
- If conversation transcripts are persisted (pending open question), they are PII and must follow the same never-log-secrets, least-privilege-access handling as contact-form data.

## 12. Analytics and observability

- Instrument CTA engagement (FR-012) to evaluate the `NORTH_STAR.md` success signal.
- Log contact-form submission outcomes (success/failure) for operational visibility, without logging full PII payloads unnecessarily.
- Tool choice (e.g. Vercel Analytics, Plausible, GA4) — open question.

## 13. Edge cases

- JavaScript fails to hydrate or is disabled: core identity content (name, role, top stats, contact links) must still be visible from server-rendered HTML.
- Third-party embed (Calendly) is slow or blocked (ad blocker, corporate network): fallback contact paths remain usable and visible.
- Recruiter double-submits the contact form: server-side idempotency/duplicate-prevention per `.claude/rules/backend.md`.
- A project or case study temporarily has incomplete detail during the content-completion pass: renders as an intentional "sparse" state, not a broken layout.
- Resume PDF goes stale relative to on-page claims: flagged as an ongoing content-maintenance risk, not solvable by design alone.

## 14. Launch criteria

- All FR/NFR implemented and verified (see `ACCEPTANCE_CRITERIA.md`).
- Content-completion pass finished — no placeholder/lorem content remains (see `OPEN_QUESTIONS.md`).
- Lint/typecheck/tests pass (`./scripts/verify.sh full`).
- Responsive and accessibility verified with Playwright evidence across mobile/tablet/desktop.
- Security review complete for the contact-form backend (`security-gate` skill) before merge.
- Security review complete for the voice agent (`security-gate` skill), specifically covering prompt-injection resistance, guardrail behavior under adversarial input, cost/rate-limit enforcement, and credential handling — before merge.
- Voice agent demonstrated live (not just unit-tested) answering grounded questions correctly and deflecting adversarial/off-topic input in character, with evidence captured.
- `docs/40-execution/CURRENT_STATE.md` reflects the shipped reality.
- Production cutover only after explicit human approval.

## 15. Open questions

See `OPEN_QUESTIONS.md`.

## 16. Acceptance criteria

See `ACCEPTANCE_CRITERIA.md`.
