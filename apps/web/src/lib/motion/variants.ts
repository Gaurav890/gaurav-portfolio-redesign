import type { Transition, Variants } from "framer-motion";

/**
 * Shared motion constants and variant factories per
 * docs/20-design/DESIGN_SYSTEM.md "Motion":
 * - Entrance: 12-16px translate, 300-400ms, ease-out.
 * - Page transitions / hover: fast, 120-180ms, never longer than ~450ms
 *   (outside the voice agent's own audio-reactive visualization).
 * - When `prefers-reduced-motion` is set, entrance/scroll animations
 *   collapse to instant or opacity-only transitions.
 *
 * Every entrance/scroll animation in the app should build its variants with
 * `getFadeInUp()` rather than hand-rolling transform/opacity values, so the
 * reduced-motion behavior stays consistent by construction.
 */

export const ENTRANCE_TRANSITION: Transition = {
  duration: 0.35,
  ease: "easeOut",
};

export const INTERACTION_TRANSITION: Transition = {
  duration: 0.15,
  ease: "easeOut",
};

/**
 * A fade-up entrance variant: rises 16px while fading in. When
 * `prefersReducedMotion` is true, collapses to an instant opacity-only
 * transition (no translate, near-zero duration) per DESIGN_SYSTEM.md.
 */
export function getFadeInUp(prefersReducedMotion: boolean): Variants {
  if (prefersReducedMotion) {
    // Explicitly pin y to 0 in both states (not just omit it) — the
    // `usePrefersReducedMotion` hook can only report its real value after
    // hydration (server-safe default is "false"), so this factory can be
    // called with `false` on first client render and `true` moments later
    // once corrected. If the reduced variant left `y` unspecified here,
    // Framer Motion would leave whatever transform was already applied by
    // the non-reduced "hidden" state (y: 16) permanently stuck instead of
    // resetting it, since it only animates properties a variant defines.
    return {
      hidden: { opacity: 0, y: 0 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.01 },
      },
    };
  }

  return {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: ENTRANCE_TRANSITION,
    },
  };
}
