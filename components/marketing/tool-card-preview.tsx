"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { PublicTool } from "@/config/tools";

const HOLD_MS = 2200;

/**
 * A small synthetic before/after strip inside a tool card — not a recorded
 * screen capture, just a cross-fade between the tool's own `example.before`
 * (or, absent that, its first required field's placeholder) and
 * `example.value`. Both are real authored copy already used elsewhere on the
 * tool's own page, never fabricated for this component.
 */
export function ToolCardPreview({ tool }: { tool: PublicTool }) {
  const before =
    tool.example.before ??
    tool.fields.find((f) => f.required && f.placeholder)?.placeholder;
  const after = tool.example.value;

  const [showAfter, setShowAfter] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion || !before) return;
    const id = setInterval(() => setShowAfter((v) => !v), HOLD_MS);
    return () => clearInterval(id);
  }, [reduceMotion, before]);

  if (!before) return null;

  const label = showAfter ? "After" : "Before";
  const text = showAfter ? after : before;

  return (
    <div className="relative mt-3 overflow-hidden rounded-lg border border-border bg-muted/40 px-3 py-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="relative mt-1 h-8">
        <AnimatePresence mode="wait">
          <motion.p
            key={label}
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="line-clamp-2 text-[12.5px] leading-snug text-foreground/80"
          >
            {text}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
