"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const INTERVAL_MS = 2200;

/**
 * Cycles through a list of words, fading one out and the next in. Falls back
 * to a static first word under reduced motion. The full list is always
 * present for screen readers via a sr-only sibling the caller renders
 * alongside this — this component's own output is presentational only.
 */
export function HeroHeadline({
  words,
  className,
  punctuate = true,
}: {
  words: string[];
  className?: string;
  /** The trailing full stop, wanted when this ends a sentence and not when
   *  it sits mid-clause (the hero's supporting line). */
  punctuate?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion || words.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % words.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [words.length, reduceMotion]);

  return (
    <span className={cn("inline-grid", className)}>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          /* Reduced motion holds on the first word (the interval above never
             starts) and lands it instantly. Rendering a different element for
             that case desynchronised hydration: `useReducedMotion` reads
             `matchMedia`, which SSR does not have. */
          transition={
            reduceMotion ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }
          }
          className="col-start-1 row-start-1"
        >
          {words[index]}
          {punctuate ? "." : ""}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
