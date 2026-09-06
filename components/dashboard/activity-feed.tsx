"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CircleAlert,
  CreditCard,
  Gift,
  RotateCcw,
  Settings2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Reveal } from "@/components/reveal";
import { ToolTile } from "@/components/tools/tool-tile";
import { Button } from "@/components/ui/button";
import type { ActivityItem, ActivityKind } from "@/lib/dashboard/activity";
import { cn, formatDateTime, formatNumber } from "@/lib/utils";

const NON_TOOL_ICON: Record<Exclude<ActivityKind, "generation" | "generation_failed">, typeof Gift> = {
  order: CreditCard,
  refund: RotateCcw,
  bonus: Gift,
  adjustment: Settings2,
};

export function ActivityFeed({
  initialItems,
  initialCursor,
  toolMeta,
}: {
  initialItems: ActivityItem[];
  initialCursor: string | null;
  /** slug → icon + category, for tinting a generation row's tile. */
  toolMeta: Record<string, { icon: string; category: string }>;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/activity?before=${encodeURIComponent(cursor)}`,
      );
      if (!response.ok) throw new Error();
      const page = await response.json();
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch {
      toast.error("Could not load more activity.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ul className="relative space-y-1">
        {items.map((item, i) => {
          const meta = item.toolSlug ? toolMeta[item.toolSlug] : undefined;
          const isGeneration =
            item.kind === "generation" || item.kind === "generation_failed";
          const Icon = isGeneration
            ? null
            : NON_TOOL_ICON[item.kind as keyof typeof NON_TOOL_ICON];

          return (
            <Reveal
              as="li"
              key={item.id}
              /* Only the first screenful staggers; anything loaded by "Load
                 more" is already below the fold when it mounts. */
              delay={Math.min(i, 8) * 0.03}
              className="relative flex gap-3.5 rounded-lg px-2 py-3 transition-colors hover:bg-accent/50"
            >
              <div className="relative flex flex-col items-center">
                {isGeneration ? (
                  item.kind === "generation_failed" ? (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                      <CircleAlert className="h-4 w-4" aria-hidden="true" />
                    </span>
                  ) : (
                    <ToolTile
                      icon={meta?.icon ?? "Sparkles"}
                      category={meta?.category}
                    />
                  )
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    {Icon ? (
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    )}
                  </span>
                )}
                {i < items.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="mt-1 w-px flex-1 bg-border"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="text-[13.5px] font-medium hover:text-primary"
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <span className="text-[13.5px] font-medium">{item.title}</span>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {formatDateTime(item.createdAt)}
                  </span>
                </div>
                {item.detail && (
                  <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                    {item.detail}
                  </p>
                )}
              </div>

              {item.credits !== null && item.credits !== 0 && (
                <span
                  className={cn(
                    "shrink-0 self-start text-[13px] font-medium tabular-nums",
                    item.credits > 0 ? "text-success" : "text-muted-foreground",
                  )}
                >
                  {item.credits > 0 ? "+" : ""}
                  {formatNumber(item.credits)}
                </span>
              )}
            </Reveal>
          );
        })}
      </ul>

      {cursor && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" size="sm" loading={loading} onClick={loadMore}>
            Load more
          </Button>
        </div>
      )}
    </>
  );
}
