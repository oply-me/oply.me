"use client";

import Link from "next/link";
import { ToolTile } from "@/components/tools/tool-tile";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { categoryMap } from "@/config/categories";

/** Everything the preview shows. All of it comes from config/tools.ts. */
export interface ToolPreview {
  slug: string;
  name: string;
  icon: string;
  category: string;
  tagline: string;
  creditCost: number;
}

/**
 * Mini tool preview shown when a tool name in a history or favorites row is
 * hovered — the row already names the tool, but not what it does or what it
 * costs to run again.
 *
 * Hover-only, so it is strictly additive: the trigger is the same link it was
 * before, and touch users lose nothing. With no `tool` (a slug that is no
 * longer in the registry) it renders the link on its own.
 */
export function ToolHoverCard({
  tool,
  children,
}: {
  tool?: ToolPreview;
  children: React.ReactNode;
}) {
  if (!tool) return <>{children}</>;

  const category = categoryMap.get(tool.category);

  return (
    <HoverCard openDelay={220} closeDelay={120}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent>
        <div className="flex items-start gap-3">
          <ToolTile icon={tool.icon} category={tool.category} className="h-10 w-10" />
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold leading-snug">{tool.name}</p>
            {category && (
              <p className="text-[11px] text-muted-foreground">{category.name}</p>
            )}
          </div>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          {tool.tagline}
        </p>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[12px]">
          <span className="tabular-nums text-muted-foreground">
            {tool.creditCost} credits per run
          </span>
          <Link
            href={`/tools/${tool.slug}`}
            className="font-medium text-primary hover:underline"
          >
            Open
          </Link>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
