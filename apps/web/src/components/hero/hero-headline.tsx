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
    // never move once measured.
    for (const charEl of split.chars) {
      const width = (charEl as HTMLElement).getBoundingClientRect().width;
      gsap.set(charEl, { display: "inline-block", width, textAlign: "center" });
    }

    const timeline = gsap.timeline();

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

    return () => {
      timeline.kill();
      split.revert();
    };
  }, [prefersReducedMotion]);

  return (
    <h1 ref={headingRef} id={id} className={className}>
      {children}
    </h1>
  );
}
