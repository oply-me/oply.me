"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, StarOff } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/copy-button";
import { ToolIcon } from "@/components/icon";
import { Markdown } from "@/components/tools/markdown";
import { Button } from "@/components/ui/button";
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
  tools: { slug: string; icon: string }[];
}) {
  const router = useRouter();
  const [list, setList] = useState(items);
  const [expanded, setExpanded] = useState<string | null>(null);
  const iconBySlug = new Map(tools.map((t) => [t.slug, t.icon]));

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
    <ul className="space-y-3">
      {list.map(({ favoriteId, generation }) => {
        const isOpen = expanded === favoriteId;
        const output =
          generation.output_text ||
          (generation.output_json
            ? JSON.stringify(generation.output_json, null, 2)
            : "");

        return (
          <li key={favoriteId} className="rounded-xl border border-border bg-card">
            <div className="flex items-start gap-3 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ToolIcon
                  name={iconBySlug.get(generation.tool_slug) ?? "Sparkles"}
                  className="h-4 w-4"
                />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/tools/${generation.tool_slug}`}
                    className="text-[13.5px] font-medium hover:text-primary"
                  >
                    {generation.tool_name}
                  </Link>
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
          </li>
        );
      })}
    </ul>
  );
}
