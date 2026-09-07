import { ArrowRight, Coins, Sparkles } from "lucide-react";
import { ToolTile } from "@/components/tools/tool-tile";
import { categoryColors } from "@/config/categories";
import type { PublicTool } from "@/config/tools";
import { cn } from "@/lib/utils";

/**
 * The hero's right-hand graphic.
 *
 * Every element in it is real: the tiles are actual tools from the registry
 * with their real names, icons, category hues and credit costs, and the sample
 * line is the tool's own authored `example` copy — the same text the tool page
 * shows. Nothing here is a mocked-up screenshot of a product that does not
 * exist, and there are no invented counts or ratings.
 *
 * Deliberately CSS-only. The float keyframes already exist in the Tailwind
 * config and the global `prefers-reduced-motion` rule freezes them, so this
 * costs no JavaScript and no Framer bundle on the site's largest page.
 */
export function HeroVisual({
  tools,
  className,
}: {
  /** Featured tools, already filtered by the caller. */
  tools: PublicTool[];
  className?: string;
}) {
  const [lead, second, third] = tools;
  if (!lead) return null;

  const leadColors = categoryColors(lead.category);

  return (
    <div
      className={cn("relative isolate", className)}
      /* Decorative: the same tools and copy are all present as real text
         elsewhere on the page, so nothing is lost by hiding it. */
      aria-hidden="true"
    >
      {/* Colour blooms behind the stack. */}
      <div
        className="animate-float-slow absolute -right-10 -top-16 h-64 w-64 rounded-full bg-brand/30 blur-[90px]"
      />
      <div
        className="animate-float absolute -bottom-16 -left-12 h-56 w-56 rounded-full bg-brand-2/25 blur-[90px]"
      />

      <div className="relative mx-auto w-full max-w-[26rem]">
        {/* The main panel — a tool mid-generation, as the product looks. */}
        <div className="border-gradient relative rounded-feature bg-card/90 p-5 shadow-brand-lg backdrop-blur">
          <div className="flex items-center gap-3">
            <ToolTile
              icon={lead.icon}
              category={lead.category}
              className="h-11 w-11 rounded-2xl"
              iconClassName="h-5 w-5"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{lead.name}</p>
              <p className="truncate text-[12px] text-muted-foreground">
                {lead.tagline}
              </p>
            </div>
            <span
              className="flex h-7 items-center gap-1 rounded-full border border-border px-2.5 text-[11px] font-medium tabular-nums text-muted-foreground"
            >
              <Coins className="h-3 w-3" />
              {lead.creditCost}
            </span>
          </div>

          <div className="mt-4 rounded-2xl bg-muted/50 px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {lead.example.label}
            </p>
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-foreground/80">
              {lead.example.value}
            </p>
          </div>

          {/* A settled progress bar, not an animated fake of one. */}
          <div className="mt-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full w-full rounded-full"
                style={{ backgroundImage: leadColors.tile }}
              />
            </div>
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold [color:var(--solid)]"
              style={{ "--solid": leadColors.solid } as React.CSSProperties}
            >
              Done
              <Sparkles className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* Two satellites, offset so the group reads as a stack. */}
        {second && (
          <div className="animate-float-slow absolute -left-8 -top-10 hidden rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur sm:block">
            <div className="flex items-center gap-2.5">
              <ToolTile
                icon={second.icon}
                category={second.category}
                className="h-8 w-8 rounded-xl"
                iconClassName="h-4 w-4"
              />
              <span className="pr-1 text-[12.5px] font-medium">{second.name}</span>
            </div>
          </div>
        )}

        {third && (
          <div className="animate-float absolute -bottom-10 right-4 hidden rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur sm:block">
            <div className="flex items-center gap-2.5">
              <ToolTile
                icon={third.icon}
                category={third.category}
                className="h-8 w-8 rounded-xl"
                iconClassName="h-4 w-4"
              />
              <span className="text-[12.5px] font-medium">{third.name}</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
