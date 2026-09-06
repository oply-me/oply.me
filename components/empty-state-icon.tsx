"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * The circle behind an empty state's icon. It draws itself in on mount and
 * then drifts, because "nothing here yet" is one of the first screens a new
 * account sees and a dead grey dot is a poor first impression.
 *
 * The icon arrives as `children` so `EmptyState` can stay a server component:
 * its `icon` prop is a component reference, which cannot cross the client
 * boundary, but the rendered element can.
 *
 * Reduced motion zeroes the durations instead of rendering different markup —
 * `useReducedMotion` is client-only, so a structural branch would not survive
 * hydration. See the same note in components/reveal.tsx.
 */
export function EmptyStateIcon({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="mb-4"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.42, ease: [0.22, 1, 0.36, 1] }
      }
    >
      <motion.div
        className="flex h-11 w-11 items-center justify-center rounded-full bg-muted"
        animate={reduceMotion ? { y: 0 } : { y: [0, -5, 0] }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                duration: 4.5,
                ease: "easeInOut",
                repeat: Infinity,
                delay: 0.42,
              }
        }
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
