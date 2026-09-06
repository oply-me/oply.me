"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { ToolIcon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { ToolCardPreview } from "@/components/marketing/tool-card-preview";
import { categoryColors, getCategory } from "@/config/categories";
import { isNewTool, type PublicTool } from "@/config/tools";
import { cn } from "@/lib/utils";

const MotionLink = motion.create(Link);

/**
 * Every card is tinted with its category's hue (config/categories.ts), so the
 * grid reads as a colour-coded system. The hue arrives as CSS custom
 * properties, which is what lets hover states use it from a static class.
 */
export function ToolCard({
  tool,
  className,
}: {
  tool: PublicTool;
  className?: string;
}) {
  const isNew = isNewTool(tool);
  const category = getCategory(tool.category);
  const c = categoryColors(tool.category);
  const reduceMotion = useReducedMotion();

  return (
    <MotionLink
      href={`/tools/${tool.slug}`}
      /* Empty objects, not `undefined`: Framer adds a `tabindex` to an element
         that has a `whileTap`, and SSR never sees the reduced-motion media
         query, so dropping the prop entirely desynchronises hydration. */
      whileHover={reduceMotion ? {} : { y: -4 }}
      whileTap={reduceMotion ? {} : { scale: 0.98 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={
        {
          "--tile": c.tile,
          "--edge": c.edge,
          "--glow": c.glow,
          "--wash": c.wash,
          "--solid": c.solid,
        } as React.CSSProperties
      }
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5",
        "transition-[border-color,box-shadow] duration-200 hover:[border-color:var(--edge)] hover:[box-shadow:var(--glow)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {/* Category wash, revealed on hover. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 [background-image:var(--wash)] group-hover:opacity-100"
      />

      <div className="relative flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105 [background-image:var(--tile)]">
          <ToolIcon name={tool.icon} />
        </span>
        <span className="flex items-center gap-2">
          {tool.featured && <Badge variant="secondary">Popular</Badge>}
          {isNew && <Badge>New</Badge>}
          {category && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {category.label}
            </span>
          )}
        </span>
      </div>

      <h3 className="relative mt-4 text-[15px] font-semibold tracking-tight">
        {tool.name}
      </h3>
      <p className="relative mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
        {tool.description}
      </p>

      <ToolCardPreview tool={tool} />

      <div className="relative mt-5 flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs tabular-nums text-muted-foreground">
          {tool.creditCost} credits
        </span>
        <span
          className="inline-flex items-center gap-1 text-[13px] font-semibold [color:var(--solid)]"
        >
          Open tool
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </MotionLink>
  );
}
