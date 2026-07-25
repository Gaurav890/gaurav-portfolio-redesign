import { track } from "@vercel/analytics";

import { ANALYTICS_EVENTS, type CtaKind } from "./events";

/**
 * Records which contact/engagement path a visitor used (FR-012). No PII —
 * only the CTA kind is recorded, never form field values, email addresses,
 * or free text (NFR-003/PRD §10 "no PII beyond voluntary form submission").
 *
 * Safe to call from both Client and Server Components — `@vercel/analytics`
 * `track()` is a no-op outside the browser.
 */
export function trackCtaClick(cta: CtaKind): void {
  track(ANALYTICS_EVENTS.ctaClick, { cta });
}

/**
 * Records a page section entering the viewport for the first time in this
 * session — the scroll-depth milestone signal from FR-012/PRD §12. Called
 * automatically by `ScrollDepthTracker` for every `<section id="...">`
 * landmark; exposed here too for any component that wants to report a
 * custom milestone explicitly.
 */
export function trackSectionView(section: string): void {
  track(ANALYTICS_EVENTS.sectionView, { section });
}
