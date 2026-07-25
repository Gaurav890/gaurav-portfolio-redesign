# Design system

Status: Draft v1 — ready for implementation; will be refined once real photography and the ADR-001 amendment (DIY voice pipeline) are final.

## Visual thesis

**A fireside conversation, not a boardroom pitch.**

Gaurav's own words in `docs/20-design/COPY.md` set the bar: someone who grew up in Nepal idolizing Cristiano Ronaldo for proving "where you start doesn't determine where you finish," who found his real motivation building a bilingual health chatbot so a stranger could get an answer they couldn't get before, and who now builds agentic systems while insisting the point is never the technology itself but "who feels more capable because it exists." That is a person telling you a story, not a company selling you a service.

The site should feel like sitting down with him and hearing that story directly — warm paper tones instead of clinical white, editorial serif headlines instead of generic SaaS-bold sans, generous margins built for reading rather than scanning a dashboard, and a voice agent that reads as an invitation to talk, not a customer-support bubble bolted onto the corner of the screen. The technical credibility (agentic systems, a Cal Hacks win, an open-source npm library) is real and should show up — but as quiet, precise accents (monospace labels, a clean data-point treatment for stats) inside a warm frame, never as the frame itself. Warmth carries the page; precision earns the trust.

## Design principles

1. **Warmth is structural, not decorative.** Warm neutrals and a single confident accent color are the default canvas everywhere — not a gradient banner slapped on an otherwise generic light/dark theme.
2. **Read like an essay, scan like a resume.** Every section must work at two speeds: a 5-second skim (bold section labels, one strong pull-line, a clear stat) and a 2-minute read (the actual narrative prose). Never sacrifice one for the other.
3. **The voice agent is the centerpiece, not a widget.** It gets a real, named place in the layout and a distinct visual language (see the Voice agent surface pattern in `UI_PATTERNS.md`) — never a generic floating chat bubble copied from a support-widget template (this is the single biggest visual complaint about the current live site).
4. **Precision as a quiet accent.** Monospace type, tech-stack tags, and stat callouts signal engineering credibility without ever taking over the warm/narrative canvas.
5. **Earned confidence, not corporate polish.** No stock-photo gloss, no generic "trusted by" logo strips, no gratuitous gradients or glassmorphism. Confidence comes from real specificity — a real project, a real number, a real anecdote.

## Color

Semantic roles, not raw palette dumps. Exact hex values are a starting proposal — validate contrast (NFR-002/WCAG 2.2 AA, 4.5:1 body text minimum) once real photography is in hand and adjust if needed.

| Token | Role | Light | Dark |
|---|---|---|---|
| `background` | Primary canvas | `#FAF6EF` (warm paper) | `#1C1712` (warm espresso, not pure black) |
| `background-raised` | Cards, panels, the voice-agent surface | `#FFFFFF` | `#26201A` |
| `foreground` | Primary text | `#231F1B` (warm near-black ink) | `#F3ECE1` (warm cream) |
| `foreground-muted` | Secondary text, captions, metadata | `#6B6259` | `#B3A896` |
| `accent` | Primary action/emphasis, the voice-agent's signature color | `#C6552B` (warm terracotta) | `#E37A4C` (brighter terracotta for dark-mode contrast) |
| `accent-secondary` | Secondary emphasis — tags, links inside prose, chart/data accents | `#2F5D50` (deep forest teal) | `#5AA290` |
| `border` | Hairlines, dividers, input borders | `#E4D9C7` | `#3A322A` |
| `danger` | Destructive/error (form errors, failed voice session) | `#B3261E` | `#F2897F` |
| `success` | Confirmation states (form submitted, resume downloaded) | `#3E6B4F` | `#79C29A` |

Rationale: terracotta + warm paper evoke Nepal's warmth without being literal/costume-y; the deep forest teal gives a second, non-competing accent for data/tag moments so the terracotta stays reserved for primary actions and the voice agent, keeping "signature color = talk to me" legible across the whole site.

## Typography

| Role | Family | Size/scale | Weight | Usage |
|---|---|---|---|---|
| Display | A warm humanist serif (e.g. Fraunces or Source Serif 4) | 44–72px, tight leading (1.05–1.15) | 500–600 | Hero headline, section titles, pull-quotes from the narrative copy |
| Heading | Same serif family, smaller optical size | 24–36px | 500–600 | Sub-section headers (role titles, project names, Notes post titles) |
| Body | A clean humanist sans (e.g. Inter or Public Sans) | 16–19px, 1.6 line-height | 400 | All narrative prose — About, Experience descriptions, Notes posts, case-for-hire copy |
| Label/mono | A monospace (e.g. IBM Plex Mono or JetBrains Mono) | 12–14px, uppercase or small-caps for labels | 500 | Stat callouts (hero numbers), tech-stack tags, dates, the voice-agent's "listening/thinking/speaking" status label |

Pairing rationale: serif display carries the editorial/narrative warmth; sans body stays highly readable at length; monospace is the one deliberate "this person builds systems" signal, used sparingly enough that it reads as a considered accent, not a terminal-app aesthetic (that thesis was explicitly rejected in favor of warm/narrative).

## Spacing and layout

- 8px base unit; section vertical rhythm at 96–160px between major sections on desktop, compressing to 64–96px on mobile — generous enough to read as editorial, not so much that the current site's "empty gap" problem (see the 2026-07-24 live-site audit) recurs. Every gap must contain a visible transition cue (a rule, a label, a shift in background tone) — no gap should ever be empty simply because content hasn't loaded or animated in yet.
- Content max-width ~680px for narrative prose columns (About, Notes post body) — an editorial reading measure, not full-bleed dashboard width.
- Wider (~1100–1200px) constrained grid for card-based sections (Projects, Experience timeline, Events).
- 12-column grid on desktop, 4-column on mobile, consistent gutter of 24px (16px on mobile).

## Radius, border, elevation

- Radius: soft, not sharp or pill-shaped — 12px for cards/panels, 8px for buttons/inputs, 20px for the voice-agent surface (its distinct, slightly larger radius helps it read as a different kind of object, not just another card).
- Borders: hairline (`border` token), 1px, used instead of heavy drop shadows as the primary separation technique — keeps the warm-paper feel instead of a glossy SaaS-card look.
- Elevation: minimal. A single soft, warm-tinted shadow (never cool gray) reserved for the voice-agent panel and any open dropdown/dialog — flat/hairline elsewhere.

## Iconography

- Minimal, line-style icons only where they clarify (contact methods, tags, social links) — never icon-only controls without a visible text label or accessible name (`.claude/rules/frontend.md` anti-pattern).
- The voice agent uses a custom waveform/pulse glyph (not a generic chat-bubble or robot icon) as its primary visual identity across entry point and in-conversation states.

## Motion

**Amended by DD-002 (2026-07-25)** — see `docs/20-design/DESIGN_DECISIONS.md` for full rationale. The original restrained-motion budget below is superseded; motion is now a deliberate, technically ambitious layer (Lenis smooth scroll, GSAP/ScrollTrigger choreography, a WebGL hero moment, cursor-magnetic interaction, expressive text/number reveals), not a subtle accent. `prefers-reduced-motion` (AC-009) still governs everything without exception — every new motion surface (Lenis, GSAP timelines, the WebGL element) must have an explicit reduced-motion path that resolves to a static, fully legible end state, not just the original Framer Motion primitives.

- Entrance/scroll choreography can now use real scroll-linked scrubbing, staggering, and a bolder hero treatment — not capped at 16px/300ms. Still never gratuitous: motion should always be tied to scroll position, hover, or a real state change, not looping decoration outside the voice agent's waveform and any explicitly-approved hero visual.
- The voice-agent waveform remains the one place *sustained, audio-driven* motion is earned; the new WebGL hero element is a second, explicitly-approved exception to "no looping decoration" — both must still respect reduced motion.
- Page transitions and micro-interaction hover states stay fast (120–180ms) even as entrance choreography gets more ambitious — snappy feedback and expressive entrance are not in tension.

## Interaction

- Primary buttons: solid `accent` fill, high-contrast label, used for exactly one primary action per view (never three solid buttons competing).
- The three contact CTAs (Calendly, email, resume) share equal visual weight as a group (FR-002's "incorporate all" decision) but are visually distinguished from the voice agent's single, more prominent "Talk to Gaurav" entry point, which functions as the page's signature interaction, not just a fourth button in that row.
- Forms (contact, Notes comments): inline validation on blur, not just on submit; clear success/error states per PRD §9.

## Content pacing (DD-003)

**See `docs/20-design/DESIGN_DECISIONS.md` DD-003 for full rationale.** Any section with genuine narrative depth (About first) defaults to a short hook excerpt + "Continue reading," where expansion reveals the rest as discrete, generously-spaced beats with their own entrance choreography — not one continuous block of paragraphs, and not a plain show-more toggle that just relocates the wall of text. Reserved for sections with real narrative depth; information-dense sections (Projects, Experience, Credentials) stay scannable per the P-001 hiring-manager persona's time-pressured skim path — do not apply chaptered pacing to those by default.

## Responsive strategy

Mobile-first. Verify at minimum: 390px (mobile), 768px (tablet), 1440px (desktop) per AC-008. The voice-agent surface in particular needs a distinct mobile treatment (likely a full-screen takeover on mobile vs. an inline/side panel on desktop) — specify this concretely once the ADR-001 amendment confirms the final interaction model for voice vs. text mode.

## Accessibility

- WCAG 2.2 AA minimum contrast for all text/background pairs above — re-verify the proposed hex values with a contrast checker before lock, especially `foreground-muted` on `background` in both themes.
- Every interactive control has a visible focus ring (2px, `accent` color, sufficient offset) — never suppressed.
- The voice agent's text mode (NFR-008) must be a fully keyboard-operable, screen-reader-friendly chat interface: proper `aria-live` region for incoming agent messages, labelled input, and no information conveyed by the waveform animation alone.
- Semantic landmarks (`header`, `nav`, `main`, section headings in order) throughout; no skipped heading levels.

## Required states

Every section below must define all eight states where applicable — see `docs/10-product/PRD.md` §9 for the authoritative per-section table (Hero, Projects, Contact form, Voice agent, Events, Notes). This design system does not duplicate that table; component-level detail lives in `UI_PATTERNS.md`.

## Anti-patterns

Explicitly rejected for this rebuild:
- Generic floating chatbot bubble bottom-right (the current live site's pattern) — the voice agent gets a first-class place in the layout instead.
- Gratuitous gradients or glassmorphism panels.
- Cool-gray corporate-SaaS palette with a single blue/purple accent — rejected in favor of the warm terracotta/paper palette above.
- Icon-only controls without visible labels.
- Large unstyled whitespace gaps with no visual transition cue (the current site's biggest structural weakness per the 2026-07-24 audit).
- A dashboard-card grid for Experience/Projects with no narrative copy — every card must carry real sentence-level content, not just a title and a logo.
- Terminal/monospace-dominant "hacker" aesthetic — monospace is an accent here, not the thesis (that direction was explicitly considered and rejected in favor of warm/narrative).

## Verification

Important UI must be inspected in the running application with Playwright at the three breakpoints in Responsive strategy, in both light and dark mode, and with `prefers-reduced-motion` emulated on — per `.claude/rules/frontend.md`, the builder and the evaluator of this work must be separate roles.
