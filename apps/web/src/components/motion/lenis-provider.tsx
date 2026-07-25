"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect } from "react";

import { usePrefersReducedMotion } from "@/lib/motion/use-prefers-reduced-motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Global smooth-scroll + GSAP ScrollTrigger sync (DD-002, 2026-07-25
 * animation-upgrade pass).
 *
 * Renders nothing — drives one shared RAF loop (via `gsap.ticker`, not a
 * second independent `requestAnimationFrame`) that advances Lenis and keeps
 * ScrollTrigger's scroll-position math in sync with Lenis's eased scroll
 * rather than the raw native scroll position. Any component using
 * ScrollTrigger elsewhere in the app assumes this provider is mounted once
 * near the root (see layout.tsx) — do not instantiate a second Lenis
 * instance or re-register ScrollTrigger's scroller elsewhere.
 *
 * Under `prefers-reduced-motion`, Lenis is never instantiated at all (not
 * just slowed down): eased/smoothed scroll physics are themselves a
 * vestibular-motion trigger for some users (AC-09), so the reduced-motion
 * path is genuinely native browser scroll, and ScrollTrigger falls back to
 * its own default (native-scroll) sync automatically.
 */
export function LenisProvider() {
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    // Stored as a named reference (not an inline arrow at both add/remove
    // call sites) — gsap.ticker.remove() only works with the exact same
    // function reference that was added.
    function tick(time: number) {
      lenis.raf(time * 1000);
    }
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [prefersReducedMotion]);

  return null;
}
