"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef } from "react";

import { usePrefersReducedMotion } from "@/lib/motion/use-prefers-reduced-motion";

type MagneticProps = {
  children: React.ReactNode;
  className?: string;
  /** How strongly the element follows the cursor, 0-1. Default 0.35 (subtle pull, not a full snap-to-cursor). */
  strength?: number;
};

/**
 * Wraps an interactive element (button, link) so it subtly pulls toward
 * the cursor on hover and springs back on leave (DD-002's cursor-reactive
 * interaction request, 2026-07-25 animation-upgrade pass).
 *
 * Pointer-based only by construction: `onMouseMove`/`onMouseLeave` simply
 * never fire on touch devices, so this degrades to a normal static
 * button with no extra touch-specific branching needed.
 *
 * Under `prefers-reduced-motion`, the spring is skipped entirely (no
 * `style` override applied) rather than just shortened — a magnetic pull
 * is a continuous, cursor-driven motion effect, exactly the category
 * `prefers-reduced-motion` exists to let a user opt out of (AC-09).
 */
export function Magnetic({ children, className, strength = 0.35 }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 14, mass: 0.15 });
  const springY = useSpring(y, { stiffness: 150, damping: 14, mass: 0.15 });

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (prefersReducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={prefersReducedMotion ? undefined : { x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}
