"use client";

import { motion } from "framer-motion";

import { usePrefersReducedMotion } from "@/lib/motion/use-prefers-reduced-motion";
import { getStaggerContainer } from "@/lib/motion/variants";

type StaggerRevealProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Wraps a grid/list of items so they reveal one after another on scroll
 * into view, rather than all at once — added in the 2026-07-25
 * motion-polish pass for more perceived "presence" on dense sections
 * (Projects, Credentials' cert list) than a single flat `<FadeIn>` gives.
 *
 * Pair with `<StaggerItem>` for each child — do not use `<FadeIn>` inside
 * a `StaggerReveal`, the two manage `initial`/`animate` differently.
 */
export function StaggerReveal({ children, className }: StaggerRevealProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      variants={getStaggerContainer(prefersReducedMotion)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-64px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
