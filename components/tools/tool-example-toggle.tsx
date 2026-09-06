"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PublicTool } from "@/config/tools";
import { cn } from "@/lib/utils";

/**
 * Before/after toggle for the idle result panel. `before` falls back to the
 * tool's first required field's placeholder when `example.before` isn't
 * authored — same resolution rule as ToolCardPreview, so no tool needs extra
 * copywriting just to get a toggle.
 */
export function ToolExampleToggle({ tool }: { tool: PublicTool }) {
  const before =
    tool.example.before ??
    tool.fields.find((f) => f.required && f.placeholder)?.placeholder;
  const after = tool.example.value;
  const [showAfter, setShowAfter] = useState(true);

  if (!before) {
    return (
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        {tool.example.label}: &ldquo;{after}&rdquo;
      </p>
    );
  }

  return (
    <div className="mt-4 w-full max-w-sm">
      <div className="mx-auto flex w-fit items-center gap-1 rounded-full border border-border bg-muted/40 p-1 text-[12px] font-medium">
        <button
          type="button"
          onClick={() => setShowAfter(false)}
          aria-pressed={!showAfter}
          className={cn(
            "rounded-full px-3 py-1 transition-colors",
            !showAfter ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          Before
        </button>
        <button
          type="button"
          onClick={() => setShowAfter(true)}
          aria-pressed={showAfter}
          className={cn(
            "rounded-full px-3 py-1 transition-colors",
            showAfter ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          After
        </button>
      </div>
      <div className="relative mt-3 min-h-[2.75rem]">
        <AnimatePresence mode="wait">
          <motion.p
            key={showAfter ? "after" : "before"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="text-sm text-muted-foreground"
          >
            &ldquo;{showAfter ? after : before}&rdquo;
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
