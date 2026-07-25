# Design decisions

## DD-001 — Warm/narrative visual thesis: "a fireside conversation, not a boardroom pitch"

**Date:** 2026-07-24

**Decision:** Commit the full rebuild to a warm, narrative, editorial visual thesis (warm paper/terracotta palette, serif display + sans body + monospace accents, generous reading-width layout) rather than minimal-editorial, technical/systems-inspired, or bold-maximalist alternatives. The voice agent gets a first-class, uniquely styled surface rather than a generic chat-bubble widget.

**Context:** Primary audience is hiring managers/recruiters (P-001) who need to both skim fast and be drawn into a genuine narrative — Gaurav's own About-section voice (`COPY.md`) is personal and story-driven, and the flagship feature is a voice-cloned AI agent meant to feel like talking to him, not using a support tool.

**Alternatives:** Minimal editorial (Linear/a16z-style restraint) — rejected as too cool/impersonal for a "warm and narrative" thesis. Technical/systems-inspired (terminal/monospace-forward) — rejected as competing with the "human behind the results" framing, though kept as a minor accent (monospace labels) rather than the dominant motif. Bold maximalist — rejected as higher risk/more generic-feeling than a considered editorial warmth.

**Why:** The chosen thesis is the only one of the four that lets both the narrative copy (Ronaldo/Dr. Birkhe story) and the technical credibility (agentic systems, Cal Hacks win, open-source project) coexist without either diluting the other — precision as an accent inside a warm frame, not a cold systems-dashboard frame with a personal story awkwardly inserted into it.

**Evidence:** Full rationale, tokens, and component patterns in `docs/20-design/DESIGN_SYSTEM.md` and `docs/20-design/UI_PATTERNS.md`. To be validated visually with Playwright once implementation begins (builder/evaluator separation per `.claude/rules/frontend.md`).

**Revisit trigger:** If real photography or the finished voice-agent interaction model (pending ADR-001's amendment) doesn't fit the proposed warm-paper/terracotta treatment once assembled, or if contrast validation fails WCAG 2.2 AA on the proposed hex values.

---

## DD-002 — Amend DD-001's motion restraint: richer, technically ambitious interaction layer

**Date:** 2026-07-25

**Decision:** Amends (does not replace) DD-001. The color/typography/layout thesis from DD-001 stands unchanged — warm paper, terracotta accent, serif/sans/mono pairing. What changes is the **motion and interaction budget**: DD-001's original Motion section ("subtle, editorial, never bouncy... no motion longer than ~450ms outside the voice agent") is superseded. The rebuild now targets a materially more ambitious interaction layer: Lenis-driven smooth scroll, GSAP/ScrollTrigger-choreographed scroll-linked reveals (not just Framer Motion fade-ups), a WebGL/generative hero moment, cursor-magnetic interactive elements, and expressive text/number animation (GSAP SplitText character reveals, count-up stats) — the kind of interaction density associated with award-site-caliber portfolios, not a restrained editorial site.

**Context:** After seeing the assembled (but voice-agent-less) site, Gaurav explicitly said the motion felt flat and asked whether alternative tools/concepts (GSAP, Lenis, Three.js/WebGL, cursor-reactive interactions, text-scramble, scroll-driven CSS) had been evaluated — they had not been; the first pass only used the Framer Motion primitives already in the stack. Confirmed direction covers all four: scroll-driven reveals, a bold hero moment, cursor-reactive interactions, and expressive text/number animation.

**Alternatives considered:** Keep DD-001's restraint and only add the voice agent as the "wow" factor — rejected; Gaurav explicitly wants both, not one traded against the other. A full visual-thesis pivot (different palette/typography, effectively a new DD-001) — not requested; he did not ask to abandon warm/narrative, only to make the interaction layer more ambitious.

**Why:** The original restraint assumed the voice agent alone would carry the "impressive" positioning. That assumption was Gaurav's own call at the time but he's since decided the rest of the site needs to independently earn that reaction too, especially since the voice agent (the highest-risk, most time-consuming piece) won't land for a while yet.

**New technical surface this introduces (tracked for the security/performance review, not just design):**
- `lenis` (smooth scroll) — must be disabled/pass-through under `prefers-reduced-motion` (vestibular-trigger risk, AC-009).
- `gsap` (100% free as of Webflow's 2025 acquisition, including SplitText/ScrollTrigger — verified current via web search 2026-07-25, not assumed from stale training data) — SplitText's rebuilt version has baked-in screen-reader accessibility, but reduced-motion gating and AC-010's no-JS-dependency requirement on Hero content still apply and must be verified, not assumed.
- WebGL/Three.js (or equivalent canvas) hero element — real bundle-size and LCP risk (NFR-001); must be lazy-loaded (`next/dynamic`, `ssr:false`) so it never blocks initial paint, and must degrade to a static treatment under reduced motion and on the no-JS path.

**Evidence:** To be validated the same way as DD-001 — Playwright-inspected across breakpoints/themes/reduced-motion, plus explicit before/after performance verification (T-072) given the new WebGL/GSAP bundle weight this decision knowingly introduces.

**Revisit trigger:** If the WebGL hero element measurably regresses NFR-001's LCP budget and can't be optimized further, or if Lenis/GSAP interaction genuinely conflicts with AC-009/AC-010 in a way that can't be resolved through the gating described above — surface to Gaurav rather than silently scaling back.

---

## DD-003 — Narrative pacing and information architecture: chaptered scroll storytelling

**Date:** 2026-07-25

**Decision:** Neither DD-001 (palette/typography) nor DD-002 (motion budget) addressed the thing actually missing: *pacing*. Explicit reference given: apple.com and apple.com/apple-watch-series-11 — not their visual language (no glass, no product-photography dependency, none of that transfers to a text/narrative personal site), but their **structural discipline**: one idea per screen, generous vertical space between beats, each new scroll position revealing a considered next moment rather than a dense continuous scroll of paragraphs. This site's current failure mode, named directly: the About section is 27 paragraphs of real, excellent writing presented as one undifferentiated block — exactly the "wall of text" Apple's pacing model never produces.

**The concrete pattern this establishes, to be applied wherever a section has real narrative depth (About first, then anywhere else it fits):**

1. **A hook state by default.** The section opens with a short excerpt — one strong beat of the writing (not a summary written separately from it; an actual excerpt of Gaurav's real words) plus a clear "Continue reading" affordance. Never force the full 27-paragraph block on every visitor by default.
2. **Expansion is itself a scroll journey, not a text dump.** "Continue reading" doesn't unhide one long scrollable block — it reveals the narrative broken into discrete beats (the Ronaldo/hard-work beat, the Dr. Birkhe/access beat, the closing belief statement), each getting its own generously-spaced moment as the user scrolls through, with real entrance choreography per beat. This satisfies both the literal ask ("continue reading and expand") and the structural one ("user journey that wows") with one mechanism, not two competing ones.
3. **Typography carries the pacing.** Beats that deserve emphasis (the two pull-quote lines already identified in `COPY.md`) get real display-scale treatment at these moments, not the same body-text size as connective paragraphs around them — size and rhythm are the primary hierarchy tool, matching this document's existing typography-as-hierarchy principle, not a new one.
4. **This is a content-architecture decision, not a one-off animation request.** Any future section with comparable depth (a Notes post, a long project write-up) should default to this pattern rather than a flat scroll of text, so the site doesn't develop two competing narrative conventions.

**What this explicitly does NOT mean** (guarding against the generic-AI-SaaS failure modes named directly in the brief that prompted this decision):
- Not a bento grid, not three-column feature cards, not glassmorphism, not a floating-blob hero, not decorative icons next to every heading, not center-aligned everything, not fake stats/testimonials — none of that is what "Apple-tier" means here. It means *pacing discipline and typographic confidence*, which is a much narrower and more defensible thing to borrow than Apple's visual system.
- Not a license to make every section scroll-heavy for its own sake — this pattern is reserved for sections with genuine narrative depth (About today). Projects/Experience/Credentials stay information-dense and scannable per DD-001's original P-001 (hiring-manager, time-pressured) reasoning; turning those into slow scroll journeys too would actively fight that persona's actual job.

**Context:** Direct feedback, 2026-07-25: the assembled site (post DD-002's motion-upgrade pass) still read as "basic," specifically calling out the About section's length with no progressive disclosure, and naming apple.com's pacing as the standard to study. Delivered alongside an extensive frontend-quality brief now also codified in `.claude/agents/frontend.md`'s "Frontend Quality Bar" section: visual thesis before code, a build/critic role separation, full UI-state coverage, and an explicit list of generic-AI-interface anti-patterns to actively avoid.

**Alternatives considered:** A simple show-more/show-less toggle on the existing single block — rejected as satisfying the literal words ("continue reading and expand") while missing the actual point (a toggle doesn't create a "journey," it just relocates the wall of text one click later). Rewriting/shortening the About copy itself — rejected; the writing is real, considered, and already locked as source-of-truth in `COPY.md` (see `docs/20-design/COPY.md`'s note that copy must not be altered for facts or trimmed, only reflowed for layout) — the fix is presentation architecture, not editing Gaurav's words down.

**Evidence:** To be built by a dedicated frontend-agent pass, then verified by a separate, adversarial critic pass (per the same brief's explicit builder/critic separation requirement) before being considered done — see `docs/40-execution/CURRENT_STATE.md` for in-progress status.

**Revisit trigger:** If the expanded chaptered-scroll treatment measurably increases time-to-first-contact-action for the P-001 hiring-manager persona (i.e. it becomes a tax on the time-pressured skim path rather than an optional deeper read) — the hook-state default specifically exists to prevent this, but confirm via the critic pass and real usage, not just Gaurav's or the builder's own assessment.
