"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/** Element the reveal renders as. `li`/`tr` keep list and table markup valid. */
type RevealTag = "div" | "li" | "tr";

const MOTION_TAG = {
  div: motion.div,
  li: motion.li,
  tr: motion.tr,
} as const;

/**
 * Fades and slides a section up once, the first time it scrolls into view.
 * `useReducedMotion` is checked in addition to the global CSS
 * `prefers-reduced-motion` rule in globals.css — that rule only clamps CSS
 * animation/transition durations, not Framer's JS-driven transforms.
 *
 * Reduced motion collapses the transition to zero rather than swapping in a
 * plain element: `useReducedMotion` reads `matchMedia`, so it is `true` on the
 * client's first render but never during SSR, and a branch that changes the
 * markup would hand a reduced-motion visitor a hydration mismatch. Same tree,
 * same initial style, no travel.
 *
 * `as` exists because the dashboard staggers list rows and table rows, where
 * an extra wrapping <div> would be invalid markup inside <ul>/<tbody>.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: RevealTag;
}) {
  const reduceMotion = useReducedMotion();
  const Motion = MOTION_TAG[as];

  return (
    <Motion
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.5, ease: "easeOut", delay }
      }
    >
      {children}
    </Motion>
  );
}
