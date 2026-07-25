"use client";

import dynamic from "next/dynamic";

import { usePrefersReducedMotion } from "@/lib/motion/use-prefers-reduced-motion";

// Lazy-loaded, never server-rendered: three.js + @react-three/fiber are a
// real bundle-size/LCP risk (NFR-001, DD-002's own tracked risk) if pulled
// into the main bundle. `next/dynamic` with `ssr: false` keeps this out of
// both the server render and the initial client bundle entirely — it only
// downloads once this component actually mounts, well after the hero
// text/stats (which are plain HTML/CSS, see hero.tsx) have already painted.
const HeroWebglBackground = dynamic(
  () => import("@/components/hero/hero-webgl-background").then((m) => m.HeroWebglBackground),
  { ssr: false },
);

/**
 * Hero background wrapper (DD-002's "bold hero moment"). Always renders a
 * static CSS gradient first — this is both the immediate visual (before
 * the WebGL bundle finishes downloading) and the full, permanent treatment
 * under `prefers-reduced-motion` (AC-09): the animated canvas is only
 * added on top when motion is allowed, never a required layer.
 *
 * Absolutely positioned behind the hero content, `pointer-events-none` so
 * it never intercepts clicks/text selection, and `aria-hidden` since it is
 * purely decorative — Hero's real content (h1/stats) lives in a sibling
 * element with its own stacking context, unaffected by any of this.
 */
export function HeroBackground() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[radial-gradient(circle_at_30%_20%,color-mix(in_srgb,var(--color-accent)_18%,transparent),transparent_60%)]"
    >
      {!prefersReducedMotion && (
        <div className="absolute inset-0">
          <HeroWebglBackground />
        </div>
      )}
    </div>
  );
}
