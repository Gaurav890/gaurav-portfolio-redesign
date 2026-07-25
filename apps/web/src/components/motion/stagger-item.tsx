"use client";

import { motion } from "framer-motion";

import { usePrefersReducedMotion } from "@/lib/motion/use-prefers-reduced-motion";
import { getFadeInUp } from "@/lib/motion/variants";

type StaggerItemProps = {
  children: React.ReactNode;
  className?: string;
};

/** A single child of `<StaggerReveal>` — inherits hidden/visible from the parent. */
export function StaggerItem({ children, className }: StaggerItemProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <motion.div variants={getFadeInUp(prefersReducedMotion)} className={className}>
      {children}
    </motion.div>
  );
}
