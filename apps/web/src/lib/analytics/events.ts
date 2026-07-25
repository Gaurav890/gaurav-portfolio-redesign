/**
 * FR-012 event taxonomy — the complete, authoritative list of custom events
 * this app emits. Other code should call the wrapper functions in
 * `track.ts` rather than importing `@vercel/analytics`'s `track()` directly
 * with a hand-typed event name, so this file stays the single source of
 * truth for "what do we measure."
 */

/** Which follow-up path a visitor used — PRD §7 FR-012, §12. */
export type CtaKind = "call" | "email" | "resume" | "form" | "voice-agent";

export const ANALYTICS_EVENTS = {
  ctaClick: "cta_click",
  sectionView: "section_view",
} as const;
