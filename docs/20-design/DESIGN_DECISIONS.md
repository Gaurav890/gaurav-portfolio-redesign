# Design decisions

## DD-001 — Warm/narrative visual thesis: "a fireside conversation, not a boardroom pitch"

**Date:** 2026-07-24

**Decision:** Commit the full rebuild to a warm, narrative, editorial visual thesis (warm paper/terracotta palette, serif display + sans body + monospace accents, generous reading-width layout) rather than minimal-editorial, technical/systems-inspired, or bold-maximalist alternatives. The voice agent gets a first-class, uniquely styled surface rather than a generic chat-bubble widget.

**Context:** Primary audience is hiring managers/recruiters (P-001) who need to both skim fast and be drawn into a genuine narrative — Gaurav's own About-section voice (`COPY.md`) is personal and story-driven, and the flagship feature is a voice-cloned AI agent meant to feel like talking to him, not using a support tool.

**Alternatives:** Minimal editorial (Linear/a16z-style restraint) — rejected as too cool/impersonal for a "warm and narrative" thesis. Technical/systems-inspired (terminal/monospace-forward) — rejected as competing with the "human behind the results" framing, though kept as a minor accent (monospace labels) rather than the dominant motif. Bold maximalist — rejected as higher risk/more generic-feeling than a considered editorial warmth.

**Why:** The chosen thesis is the only one of the four that lets both the narrative copy (Ronaldo/Dr. Birkhe story) and the technical credibility (agentic systems, Cal Hacks win, open-source project) coexist without either diluting the other — precision as an accent inside a warm frame, not a cold systems-dashboard frame with a personal story awkwardly inserted into it.

**Evidence:** Full rationale, tokens, and component patterns in `docs/20-design/DESIGN_SYSTEM.md` and `docs/20-design/UI_PATTERNS.md`. To be validated visually with Playwright once implementation begins (builder/evaluator separation per `.claude/rules/frontend.md`).

**Revisit trigger:** If real photography or the finished voice-agent interaction model (pending ADR-001's amendment) doesn't fit the proposed warm-paper/terracotta treatment once assembled, or if contrast validation fails WCAG 2.2 AA on the proposed hex values.
