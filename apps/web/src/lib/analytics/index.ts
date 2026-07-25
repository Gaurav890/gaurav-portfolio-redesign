/**
 * Public API for FR-012 analytics (T-050). Other components should import
 * from here — `@/lib/analytics` — rather than reaching into individual
 * files or importing `@vercel/analytics` directly.
 *
 * Usage:
 *   import { trackCtaClick } from "@/lib/analytics";
 *   <a href="mailto:..." onClick={() => trackCtaClick("email")}>Email</a>
 */
export { AnalyticsProvider } from "./analytics-provider";
export type { CtaKind } from "./events";
export { trackCtaClick, trackSectionView } from "./track";
