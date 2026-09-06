"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, StarOff } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/copy-button";
import { Reveal } from "@/components/reveal";
import { Markdown } from "@/components/tools/markdown";
import { ToolHoverCard, type ToolPreview } from "@/components/tools/tool-hover-card";
import { ToolTile } from "@/components/tools/tool-tile";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryMap } from "@/config/categories";
import { cn, formatDateTime, truncate } from "@/lib/utils";

interface Item {
  favoriteId: string;
  generation: {
    id: string;
    tool_slug: string;
    tool_name: string;
    input_preview: string | null;
    output_text: string | null;
    output_json: unknown;
    created_at: string;
  };
}

export function FavoritesList({
  items,
  tools,
}: {
  items: Item[];
  tools: ToolPreview[];
}) {
  const router = useRouter();
  const [list, setList] = useState(items);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toolFilter, setToolFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const toolBySlug = useMemo(
    () => new Map(tools.map((t) => [t.slug, t])),
    [tools],
  );

  /* Only the tools that actually appear in this list — a filter offering 15
     options for 3 saved results is noise. */
  const presentTools = useMemo(() => {
    const slugs = new Set(list.map((i) => i.generation.tool_slug));
    return tools.filter((t) => slugs.has(t.slug));
  }, [tools, list]);

  const presentCategories = useMemo(() => {
    const slugs = new Set(presentTools.map((t) => t.category));
    return [...slugs].filter(Boolean).sort();
  }, [presentTools]);

  const filtered = useMemo(
    () =>
      list.filter(({ generation }) => {
        if (toolFilter !== "all" && generation.tool_slug !== toolFilter) {
          return false;
        }
        if (categoryFilter !== "all") {
          const tool = toolBySlug.get(generation.tool_slug);
          if (tool?.category !== categoryFilter) return false;
        }
        return true;
      }),
    [list, toolFilter, categoryFilter, toolBySlug],
  );

  async function unfavorite(generationId: string) {
    const previous = list;
    setList((prev) => prev.filter((i) => i.generation.id !== generationId));

    try {
      const response = await fetch(`/api/favorites/${generationId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      toast.success("Removed from favorites");
      router.refresh();
    } catch {
      setList(previous);
      toast.error("Could not remove this favorite.");
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="sm:w-52" aria-label="Filter by category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {presentCategories.map((slug) => (
              <SelectItem key={slug} value={slug}>
                {categoryMap.get(slug)?.name ?? slug}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={toolFilter} onValueChange={setToolFilter}>
          <SelectTrigger className="sm:w-56" aria-label="Filter by tool">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tools</SelectItem>
            {presentTools
              .filter(
                (t) => categoryFilter === "all" || t.category === categoryFilter,
              )
              .map((tool) => (
                <SelectItem key={tool.slug} value={tool.slug}>
                  {tool.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mb-3 text-xs text-muted-foreground" aria-live="polite">
        {filtered.length} saved {filtered.length === 1 ? "result" : "results"}
      </p>

      <ul className="space-y-3">
      {filtered.map(({ favoriteId, generation }, i) => {
        const tool = toolBySlug.get(generation.tool_slug);
        const isOpen = expanded === favoriteId;
        const output =
          generation.output_text ||
          (generation.output_json
            ? JSON.stringify(generation.output_json, null, 2)
            : "");

        return (
          <Reveal
            as="li"
            key={favoriteId}
            delay={Math.min(i, 8) * 0.04}
            className="rounded-xl border border-border bg-card"
          >
            <div className="flex items-start gap-3 p-4">
              <ToolTile
                icon={tool?.icon ?? "Sparkles"}
                category={tool?.category}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <ToolHoverCard tool={tool}>
                    <Link
                      href={`/tools/${generation.tool_slug}`}
                      className="text-[13.5px] font-medium hover:text-primary"
                    >
                      {generation.tool_name}
                    </Link>
                  </ToolHoverCard>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDateTime(generation.created_at)}
                  </span>
                </div>
                {!isOpen && output && (
                  <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/80">
                    {truncate(output, 180)}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {output && <CopyButton value={output} size="icon-sm" variant="ghost" />}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => unfavorite(generation.id)}
                  aria-label="Remove from favorites"
                >
                  <StarOff className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setExpanded(isOpen ? null : favoriteId)}
                  aria-expanded={isOpen}
                  aria-label={isOpen ? "Collapse" : "Expand"}
                >
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
                  />
                </Button>
              </div>
            </div>

            {isOpen && output && (
              <div className="border-t border-border p-4">
                {generation.output_json ? (
                  <pre className="scroll-area max-h-96 overflow-auto rounded-lg bg-muted/40 p-4 font-mono text-[12.5px]">
                    {JSON.stringify(generation.output_json, null, 2)}
                  </pre>
                ) : (
                  <Markdown content={output} />
                )}
              </div>
            )}
          </Reveal>
        );
      })}
      </ul>
    </>
  );
}
