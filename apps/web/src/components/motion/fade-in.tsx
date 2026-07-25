"use client";

import { motion } from "framer-motion";

import { usePrefersReducedMotion } from "@/lib/motion/use-prefers-reduced-motion";
import { getFadeInUp } from "@/lib/motion/variants";

// Precomputed at module scope (not per render) so eslint's
// react-hooks/static-components rule is satisfied and each tag keeps a
// stable component identity across renders.
const TAG_TO_MOTION_COMPONENT = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  ul: motion.ul,
  li: motion.li,
} as const;

type FadeInTag = keyof typeof TAG_TO_MOTION_COMPONENT;

type FadeInProps = {
  /** Render as a different semantic element — defaults to `div`. */
  as?: FadeInTag;
  children: React.ReactNode;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

/**
 * Shared entrance-animation wrapper: fades/rises content into view once,
 * respecting `prefers-reduced-motion` (DESIGN_SYSTEM.md "Motion", AC-009).
 *
 * This is the default way any section/component in this app should animate
 * on mount or scroll into view — do not hand-roll a Framer Motion variant
 * elsewhere without going through `usePrefersReducedMotion`. Kept to a
 * narrow, common prop set (id/className/aria-label*) rather than full DOM
 * prop passthrough, since motion's per-tag event-handler types don't unify
 * across a dynamic tag union.
 */
export function FadeIn({ as = "div", children, ...rest }: FadeInProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const Component = TAG_TO_MOTION_COMPONENT[as];

  return (
    <Component
      variants={getFadeInUp(prefersReducedMotion)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-64px" }}
      {...rest}
    >
      {children}
    </Component>
  );
}
