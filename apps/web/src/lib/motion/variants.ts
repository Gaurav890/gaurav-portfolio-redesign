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
  duration: 0.55,
  ease: [0.16, 1, 0.3, 1], // expressive "ease-out-expo" - decisive, not bouncy
};

export const INTERACTION_TRANSITION: Transition = {
  duration: 0.18,
  ease: "easeOut",
};

/**
 * A fade-up entrance variant: rises while fading in (and scales in very
 * slightly for depth). When `prefersReducedMotion` is true, collapses to an
 * instant opacity-only transition (no translate/scale, near-zero duration)
 * per DESIGN_SYSTEM.md.
 *
 * 2026-07-25 motion-polish pass: dialed up from the original 16px/0.35s to
 * 28px/0.55s with an expo ease and a subtle 0.98->1 scale, per Gaurav's
 * feedback that the site needed more presence. Still "editorial, never
 * bouncy" per DESIGN_SYSTEM.md - no spring/overshoot - just a more decisive,
 * confident reveal.
 */
export function getFadeInUp(prefersReducedMotion: boolean): Variants {
  if (prefersReducedMotion) {
    // Explicitly pin y/scale/opacity to their final resting values in
    // *both* states (not just omit them, and critically not opacity:0 in
    // "hidden" either - see the 2026-07-25 critic-pass fix below).
    //
    // The `usePrefersReducedMotion` hook can only report its real value
    // after hydration (server-safe default is "false"), so this factory
    // can be called with `false` on first client render and `true`
    // moments later once corrected. If the reduced variant left y/scale
    // unspecified here, Framer Motion would leave whatever transform was
    // already applied by the non-reduced "hidden" state permanently stuck
    // instead of resetting it, since it only animates properties a
    // variant defines.
    //
    // 2026-07-25 critic-pass fix: this used to be `opacity: 0` in
    // "hidden", on the assumption that `whileInView`'s near-zero-duration
    // transition to "visible" was enough to satisfy AC-09/reduced-motion.
    // It wasn't: Framer Motion applies the "hidden" variant immediately
    // and unconditionally on mount (it is NOT scroll-gated - only the
    // *transition* to "visible" is), so any content below the fold sat at
    // real `opacity:0` - confirmed in raw SSR HTML - until a user actually
    // scrolled it into the trigger zone. For reduced-motion users that's
    // worse than no animation at all: content that should be immediately,
    // statically present was invisible until a scroll gesture triggered
    // it. Setting `hidden.opacity` to `1` (matching "visible" in every
    // property) makes the initial mount state already fully resolved -
    // nothing left to reveal, so nothing is gated behind scroll position.
    return {
      hidden: { opacity: 1, y: 0, scale: 1 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.01 },
      },
    };
  }

  return {
    hidden: { opacity: 0, y: 28, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: ENTRANCE_TRANSITION,
    },
  };
}

/**
 * A staggered-children container variant: pairs with `getFadeInUp` on child
 * elements to reveal a list/grid one item after another rather than all at
 * once. `staggerChildren` is skipped (0) under reduced motion so children
 * still each resolve instantly rather than queuing delays.
 */
export function getStaggerContainer(prefersReducedMotion: boolean): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.09,
        delayChildren: prefersReducedMotion ? 0 : 0.05,
      },
    },
  };
}
