import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ToolIcon } from "@/components/icon";
import { categoryColors, type CategoryDefinition } from "@/config/categories";
import { cn } from "@/lib/utils";

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

  return (
    <Link
      href={`/categories/${category.slug}`}
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
        "transition-all duration-200 hover:-translate-y-1 hover:[border-color:var(--edge)] hover:[box-shadow:var(--glow)]",
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
    </Link>
  );
}
