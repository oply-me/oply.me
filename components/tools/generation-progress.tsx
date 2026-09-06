"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const STAGE_MS = 1600;

/**
 * A labeled, staged progress bar for the duration of a generation call.
 *
 * The actual request (`/api/ai/generate`) is a single synchronous fetch with
 * no server-reported step signals, so this is a client-side timed animation,
 * not a readout of real backend progress: it advances through `stages` on a
 * timer and holds on the last one until `active` goes false — it never
 * claims to know more than "still working."
 */
export function GenerationProgress({
  active,
  stages,
  className,
}: {
  active: boolean;
  stages: string[];
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }
    const id = setInterval(() => {
      setIndex((i) => Math.min(i + 1, stages.length - 1));
    }, STAGE_MS);
    return () => clearInterval(id);
  }, [active, stages.length]);

  const percent = ((index + 1) / stages.length) * 100;

  return (
    <div className={cn("w-full", className)} role="status" aria-live="polite">
      <span className="sr-only">{stages[index]}</span>
      <div aria-hidden="true" className="flex items-center justify-between text-[13px] font-medium text-muted-foreground">
        <span>{stages[index]}</span>
        <span className="tabular-nums">{Math.round(percent)}%</span>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        {reduceMotion ? (
          <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        ) : (
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        )}
      </div>
    </div>
  );
}
