"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ToolIcon } from "@/components/icon";
import { categoryColors, type CategoryDefinition } from "@/config/categories";
import { cn } from "@/lib/utils";

const MotionLink = motion.create(Link);

/**
 * Hover/tap behaviour is deliberately identical to `ToolCard` — the two grids
 * sit on the same pages, and two different lift idioms read as a bug.
 */
export function CategoryCard({
  category,
  toolCount,
  className,
}: {
  category: CategoryDefinition;
  toolCount: number;
  className?: string;
}) {
  const c = categoryColors(category.slug);
  const reduceMotion = useReducedMotion();

  return (
    <MotionLink
      href={`/categories/${category.slug}`}
      /* Empty objects, not `undefined`: Framer adds a `tabindex` to an
         element that has a `whileTap`, and SSR never sees the reduced-motion
         media query, so dropping the prop entirely desynchronises hydration. */
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
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6",
        "transition-[border-color,box-shadow] duration-200 hover:[border-color:var(--edge)] hover:[box-shadow:var(--glow)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background-image:var(--wash)] opacity-70 transition-opacity duration-300 group-hover:opacity-100"
      />
      {/* A soft corner bloom in the category colour. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-25 blur-2xl transition-opacity duration-300 group-hover:opacity-45 [background-image:var(--tile)]"
      />

      <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm transition-transform duration-200 group-hover:scale-105 [background-image:var(--tile)]">
        <ToolIcon name={category.icon} className="h-6 w-6" />
      </span>

      <h3 className="relative mt-5 text-base font-semibold tracking-tight">
        {category.name}
      </h3>
      <p className="relative mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
        {category.description}
      </p>

      <span className="relative mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold [color:var(--solid)]">
        {toolCount} {toolCount === 1 ? "tool" : "tools"}
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
      </span>
    </MotionLink>
  );
}
