"use client";

import { gsap } from "gsap";
import { useEffect, useRef } from "react";

import { usePrefersReducedMotion } from "@/lib/motion/use-prefers-reduced-motion";

type HeroStatValueProps = {
  value: string;
  className: string;
};

/**
 * A single hero stat value with a GSAP count-up animation (DD-002,
 * 2026-07-25 animation-upgrade pass) — e.g. "$1.7M+" counts up from 0.
 *
 * Same non-hiding pattern as `HeroHeadline`: the real, correct value is
 * always in the server-rendered HTML (AC-010) and stays there permanently
 * for no-JS visitors. Once mounted, JS resets the display to 0 and counts
 * back up to the same real value — if the animation is interrupted for any
 * reason, the cleanup below still leaves the correct final text in place
 * rather than a stuck intermediate number.
 */
export function HeroStatValue({ value, className }: HeroStatValueProps) {
  const ref = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion) return;

    const match = value.match(/^([^\d]*)([\d.]+)(.*)$/);
    if (!match) return;
    const [, prefix, numberStr, suffix] = match;
    const target = Number.parseFloat(numberStr);
    const decimals = numberStr.includes(".") ? numberStr.split(".")[1].length : 0;

    const state = { current: 0 };
    const tween = gsap.to(state, {
      current: target,
      duration: 1.3,
      delay: 0.55,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = `${prefix}${state.current.toFixed(decimals)}${suffix}`;
      },
      onComplete: () => {
        el.textContent = value; // guarantee exact original formatting
      },
    });

    return () => {
      tween.kill();
      el.textContent = value; // never leave a mid-count value on unmount
    };
  }, [value, prefersReducedMotion]);

  return (
    <dd ref={ref} className={className}>
      {value}
    </dd>
  );
}
