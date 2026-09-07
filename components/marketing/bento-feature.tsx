import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { ToolTile } from "@/components/tools/tool-tile";
import type { PublicTool } from "@/config/tools";
import { cn } from "@/lib/utils";

/**
 * The dark feature tile in the bento grid.
 *
 * Its content is drawn entirely from things that already exist: real tools
 * from the registry, and the real product facts stated elsewhere on the site
 * (one balance, credits never expire, failed runs refunded). The CTA points at
 * a route that exists — nothing here is a placeholder for a feature that has
 * not been built.
 */
export function BentoFeature({
  tools,
  href = "/tools",
  className,
}: {
  tools: PublicTool[];
  href?: string;
  className?: string;
}) {
  const facts = [
    "One credit balance across every tool",
    "Credits never expire",
    "Failed generations are refunded automatically",
  ];

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-feature p-7 sm:p-9",
        "bg-[linear-gradient(135deg,hsl(256_60%_18%),hsl(258_70%_26%)_55%,hsl(266_60%_20%))]",
        className,
      )}
    >
      {/* Glow, kept behind the content and out of the text's contrast path. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-brand-2/35 blur-[80px]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-brand-3/20 blur-[80px]"
      />

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
            One workspace
          </p>
          <h2 className="mt-3 text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.02em] text-white sm:text-[2.125rem]">
            Create stunning content
            <br />
            <span className="bg-gradient-to-r from-white to-brand-2/80 bg-clip-text text-transparent">
              with AI
            </span>
          </h2>

          <ul className="mt-6 space-y-3">
            {facts.map((fact) => (
              <li key={fact} className="flex items-start gap-2.5 text-[14px] text-white/75">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Check className="h-2.5 w-2.5 text-white" aria-hidden="true" />
                </span>
                {fact}
              </li>
            ))}
          </ul>

          <Link
            href={href}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[14px] font-semibold text-[hsl(256_60%_18%)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            Browse every tool
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* A column of real tools, as a graphic. */}
        <ul className="hidden w-[17rem] gap-2.5 lg:grid" aria-hidden="true">
          {tools.slice(0, 4).map((tool, i) => (
            <li
              key={tool.slug}
              className={cn(
                "flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur",
                i % 2 === 1 && "translate-x-4",
              )}
            >
              <ToolTile
                icon={tool.icon}
                category={tool.category}
                className="h-8 w-8 rounded-xl"
                iconClassName="h-4 w-4"
              />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-white/90">
                {tool.name}
              </span>
              <span className="shrink-0 text-[11px] tabular-nums text-white/45">
                {tool.creditCost}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
