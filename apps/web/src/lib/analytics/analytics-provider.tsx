import { Analytics } from "@vercel/analytics/next";

import { ScrollDepthTracker } from "./scroll-depth-tracker";

/**
 * Single mount point for all FR-012 instrumentation (T-050):
 * - Page views: `<Analytics/>` from `@vercel/analytics/next`, which
 *   auto-tracks App Router navigations — no manual pageview calls needed.
 * - Section scroll-depth milestones: `ScrollDepthTracker`.
 * - CTA-click tracking: not mounted here — components call
 *   `trackCtaClick()` directly (see `./track`) at the moment of the click.
 *
 * Vercel Analytics is a privacy-respecting default (no cookies, no
 * cross-site tracking, IP addresses not stored) per OQ-004's non-blocking
 * resolution in TASKS.jsonl T-050 — revisit if Gaurav has a different tool
 * preference.
 *
 * Render exactly once, from the root layout.
 */
export function AnalyticsProvider() {
  return (
    <>
      <Analytics />
      <ScrollDepthTracker />
    </>
  );
}
