"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Entrance for a finished generation. Keyed on the generation id, so a
 * regenerate or a refinement cross-fades to the new result instead of the
 * text silently swapping underneath the reader.
 *
 * Deliberately smaller in scale than the marketing `Reveal`: this fires right
 * where the eye already is, after a wait, so it wants to settle rather than
 * announce itself. Reduced motion zeroes the duration rather than dropping the
 * wrapper — see the note in components/reveal.tsx.
 */
export function ResultReveal({
  resultKey,
  children,
}: {
  resultKey: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={resultKey}
        initial={{ opacity: 0, scale: 0.985, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.99 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }
        }
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
