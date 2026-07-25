# UI patterns

Document recurring product-specific interaction patterns. See `DESIGN_SYSTEM.md` for tokens/principles and `docs/10-product/PRD.md` §9 for the authoritative per-section state table.

## Voice agent surface ("Talk to Gaurav")

**Use when:** The primary entry point for FR-013 anywhere on the site (likely anchored near the hero, with a persistent lightweight entry affordance — e.g. a labeled tab/rail, not an icon-only bubble — reachable from any scroll position).

**Do not use when:** Never duplicate this as a generic floating chat-bubble pattern (explicit anti-pattern in `DESIGN_SYSTEM.md`). Never present voice mode without the text-mode toggle visibly available in the same surface (NFR-008 — parity, not a hidden fallback).

**Behavior:**
- Entry point reads as an invitation ("Talk to Gaurav" with the waveform/pulse glyph), not a support-widget icon.
- On activation, opens into a distinct `background-raised` panel with the larger 20px radius and warm-tinted shadow defined in `DESIGN_SYSTEM.md` — full-screen takeover on mobile, inline/side panel on desktop (exact breakpoint behavior to be finalized once ADR-001's amendment confirms the final voice-pipeline interaction model).
- A visible, always-available mode toggle (voice ⇄ text) sits at the top of the panel — switching modes does not lose conversation context.
- In voice mode, the waveform glyph is the only sustained animation on the page, visualizing real mic/agent audio activity; collapses to a static icon under `prefers-reduced-motion`.
- In text mode, standard chat-transcript layout: user messages right-aligned or visually distinct, agent messages left-aligned, using body typography (not monospace) so it reads as conversation, not a terminal.
- A persistent, unobtrusive session-progress indicator communicates the approaching time/turn cap (per ADR-001 D5) so the eventual wrap-up never feels sudden to the visitor.

**Accessibility:**
- Fully keyboard-operable: tab to open, tab through mode toggle and input, Escape to close.
- Text mode uses an `aria-live="polite"` region for incoming agent messages so screen readers announce responses without interrupting.
- Mic permission requests and connection states are announced, not just shown visually.
- Focus is trapped appropriately while the panel is open and returned to the triggering element on close.

**States:** connecting (spinner + label, not a blank panel), initial greeting (agent speaks/types first), active conversation (dense — scrollable transcript), mic-permission-denied or connection-drop (explicit inline message offering to switch to text mode, never a silent dead end), session-cap reached (graceful wrap-up message + visible contact CTA, per AC-016), closed/idle (collapses back to the entry affordance).

## Experience timeline entry

**Use when:** Each role in the Experience section (FR-006).

**Do not use when:** Do not compress roles into bare title/company/date rows with no narrative — every entry must carry at least one sentence of real story per `DESIGN_SYSTEM.md` principle 2.

**Behavior:** Chronological, expandable/collapsible per entry (current site's pattern is reasonable here) but each entry shows company, title, dates, location, and a visible narrative excerpt even when collapsed — not just metadata. Expanding reveals the full story-framed accomplishment copy.

**Accessibility:** Expand/collapse controls are real buttons with `aria-expanded` state, keyboard-operable, not click-only `div`s.

**States:** collapsed (default, shows excerpt), expanded (full narrative), dense (6+ roles scrolls within the section rather than pushing the whole page length further), loading/empty/error do not apply (static content).

## Project card

**Use when:** Each of the six Featured Projects (FR-007).

**Do not use when:** Not for Events or Notes entries — those get their own patterns below.

**Behavior:** Card shows project name, one-line tagline, a short problem/approach/outcome narrative (not just a tech-stack tag list), tech-stack tags (monospace label style), and an external link (GitHub/npm/live site) where one exists. Photography or a representative visual per project where available; a defined placeholder treatment (not a broken image icon) when not.

**Accessibility:** The whole card is not one giant click target with no visible link text — the external link has a clear, labeled affordance.

**States:** sparse (fewer than 3 projects still reads intentional — not applicable at launch with 6, but keep the layout resilient), dense (6 projects — grid should not feel cramped; consider a slightly larger card or 2-column grid over a tight 3+ column grid), missing image (placeholder), standard/success (fully populated).

## Notes list + detail

**Use when:** The personal writing section (FR-015).

**Do not use when:** Not for the professional Medium blog (stays external, just linked).

**Behavior:** List view shows post title (serif heading), date, tags (monospace label style, filterable), and a short excerpt. Detail view is a single ~680px-max-width reading column (per `DESIGN_SYSTEM.md` spacing) with the post body, tags, an RSS-subscribe affordance, and a comment section below the post body. Comment form: name (or handle) + comment body, honeypot field hidden from view, inline validation, auto-publishes on success (per the locked moderation decision) with a lightweight optimistic-append so the commenter sees their comment immediately.

**Accessibility:** Tag filters are real, labeled, keyboard-operable controls (not icon-only); comment form has proper label associations and error announcements.

**States:** empty (zero posts — a warm "more soon, subscribe via RSS" message, not a broken-looking blank list), sparse (1–2 posts, still full-width/intentional layout, not stretched to fill a grid meant for many), dense (pagination, not infinite unstyled scroll), invalid (comment form field errors), error (comment submission failure — explicit message, comment not silently lost), disabled (submit button while comment is pending), success (comment appears with a brief confirmation).

## Events entry

**Use when:** The Events section (FR-014).

**Do not use when:** Not a substitute for Experience — Events is about ongoing presence/momentum (talks, hackathons, meetups), not employment history.

**Behavior:** Two groupings — "Attended" (past, chronological) and "Upcoming" (future, chronological) — each entry shows event name, date, location/format (in-person/virtual), and an optional one-line note (e.g. "won Best Use of Claude"). Visually lighter-weight than Project cards or Experience entries — this section supports the narrative, it doesn't compete with Projects/Experience for primary attention.

**Accessibility:** Standard semantic list structure; date formatting is unambiguous (not solely numeric MM/DD that could be misread).

**States:** empty/sparse (launch state — "Nothing scheduled right now, check back soon" rather than an empty grid or a hidden section that looks like a missing page), dense (scrollable/paginated once many events accumulate), loading/error/disabled/success do not apply (static content).

## Contact action group

**Use when:** The Contact section and any secondary placement of the three equal-weight CTAs (Calendly, email, resume) per FR-002.

**Do not use when:** Do not let this group visually outrank the voice agent's entry point — the voice agent is the signature interaction; this group is the practical follow-up layer.

**Behavior:** Three equally weighted actions presented as a clear group (not stacked as three competing primary buttons across the page) alongside the real contact form (FR-003). Resume download triggers a real file download with visible feedback (not just a silent new tab).

**Accessibility:** Each action has clear, descriptive link/button text (not just an icon or "Click here").

**States:** form has full loading/invalid/error/disabled/success states per `docs/10-product/PRD.md` §9; the Calendly embed has an explicit fallback state if it fails to load (direct link, not a blank iframe box).
