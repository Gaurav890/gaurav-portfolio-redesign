"use client";

import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { useEffect, useRef } from "react";

import { usePrefersReducedMotion } from "@/lib/motion/use-prefers-reduced-motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(SplitText);
}

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

type HeroHeadlineProps = {
  id: string;
  className: string;
  children: string;
};

/**
 * The hero H1, with a GSAP SplitText character-scramble effect layered on
 * top (DD-002, 2026-07-25 animation-upgrade pass).
 *
 * Deliberately NOT a hide-then-reveal effect: the real heading text is
 * always present and visible from first paint (AC-010's no-JS-dependency
 * requirement for Hero content, unchanged by this pass) — GSAP only
 * substitutes each character's glyph briefly, on an already-visible
 * element, before settling back to the real text, once mounted. If JS
 * never loads, the plain real heading is exactly what a no-JS visitor
 * sees; nothing is ever hidden behind an animation that might not run.
 *
 * SplitText's 2025 rewrite has baked-in screen-reader accessibility
 * (it manages the accessible text/reading order independently of the
 * per-character DOM split), so this does not need a manual aria-label
 * workaround the way older SplitText usage patterns did.
 *
 * 2026-07-25 critic-pass fix: the character-width lock below is only ever
 * correct for the viewport size it was measured at. The original version
 * of this component left those fixed-width spans in the DOM permanently
 * (only reverted on unmount), so a real user resizing their window, or
 * rotating a tablet, after the ~1.5s scramble finished would see the
 * heading's characters overlap or spread apart with gaps - a regression
 * into the exact "headline visibly breaks" complaint this component was
 * already fixed for once this session. Fixed by reverting SplitText's DOM
 * changes back to plain text (a) automatically once the scramble
 * animation completes, and (b) immediately on any window resize, so the
 * fixed-width spans never outlive the brief window where they're valid.
 * After revert, the heading is just its normal responsive text - no
 * animation replays on resize, which is correct: this is a one-time
 * entrance effect, not something that should re-trigger.
 */
export function HeroHeadline({ id, className, children }: HeroHeadlineProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!headingRef.current || prefersReducedMotion) return;

    const split = SplitText.create(headingRef.current, {
      type: "words, chars",
      wordsClass: "inline-block",
      charsClass: "inline-block",
    });

    // Lock every character cell to its own natural rendered width *before*
    // scrambling starts. Without this, swapping a narrow original glyph
    // (e.g. "i") for a wider scrambled one (e.g. "W") changes that char's
    // layout width, which cascades into the whole heading reflowing and
    // rewrapping mid-animation - this was a real, visible bug (words
    // jumping between lines every frame), not a style nitpick. Fixing the
    // width turns each character into a stable-width cell that just
    // displays a different glyph inside it, so the heading's line breaks
    // never move once measured. This lock is only ever valid until the
    // next resize or the animation's own completion - see revertOnce below.
    for (const charEl of split.chars) {
      const width = (charEl as HTMLElement).getBoundingClientRect().width;
      gsap.set(charEl, { display: "inline-block", width, textAlign: "center" });
    }

    let hasReverted = false;
    function revertOnce() {
      if (hasReverted) return;
      hasReverted = true;
      timeline.kill();
      split.revert();
    }

    const timeline = gsap.timeline({ onComplete: revertOnce });

    split.chars.forEach((charEl, index) => {
      const originalChar = charEl.textContent ?? "";
      if (originalChar.trim() === "") return; // leave whitespace untouched

      const state = { progress: 0 };
      timeline.to(
        state,
        {
          progress: 1,
          duration: 0.4,
          ease: "none",
          onUpdate: () => {
            charEl.textContent =
              state.progress < 0.75
                ? SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
                : originalChar;
          },
          onComplete: () => {
            charEl.textContent = originalChar;
          },
        },
        index * 0.022, // staggered start per character, not sequential
      );
    });

    // Defense in depth: if a resize happens *during* the brief scramble
    // window (before the onComplete revert above has fired), don't let the
    // now-stale fixed widths linger even for one extra frame - jump
    // straight to the real, correctly-reflowing text instead.
    window.addEventListener("resize", revertOnce);

    return () => {
      window.removeEventListener("resize", revertOnce);
      revertOnce();
    };
  }, [prefersReducedMotion]);

  return (
    <h1 ref={headingRef} id={id} className={className}>
      {children}
    </h1>
  );
}
