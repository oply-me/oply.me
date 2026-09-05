"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/copy-button";
import { ToolIcon } from "@/components/icon";
import { Markdown } from "@/components/tools/markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatDateTime, truncate } from "@/lib/utils";

interface Generation {
  id: string;
  tool_slug: string;
  tool_name: string;
  input_preview: string | null;
  output_text: string | null;
  output_json: unknown;
  credits_used: number;
  status: string;
  created_at: string;
}

interface ToolMeta {
  slug: string;
  name: string;
  icon: string;
  category: string;
}

export function HistoryList({
  generations,
  tools,
  favoriteIds,
  activeTool,
}: {
  generations: Generation[];
  tools: ToolMeta[];
  favoriteIds: string[];
  activeTool: string | null;
}) {
  const router = useRouter();
  const [items, setItems] = useState(generations);
  const [favorites, setFavorites] = useState(new Set(favoriteIds));
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toolFilter, setToolFilter] = useState(activeTool ?? "all");
  const [range, setRange] = useState("all");
  const [pendingDelete, setPendingDelete] = useState<Generation | null>(null);
  const [busy, setBusy] = useState(false);

  const toolBySlug = useMemo(
    () => new Map(tools.map((t) => [t.slug, t])),
    [tools],
  );

  const usedTools = useMemo(
    () =>
      tools.filter((t) => generations.some((g) => g.tool_slug === t.slug)),
    [tools, generations],
  );

  const filtered = useMemo(() => {
    const cutoff =
      range === "7d"
        ? Date.now() - 7 * 864e5
        : range === "30d"
          ? Date.now() - 30 * 864e5
          : null;

    return items.filter((item) => {
      if (toolFilter !== "all" && item.tool_slug !== toolFilter) return false;
      if (cutoff && new Date(item.created_at).getTime() < cutoff) return false;
      return true;
    });
  }, [items, toolFilter, range]);

  async function toggleFavorite(generationId: string) {
    const isFav = favorites.has(generationId);
    // Optimistic — reverted below if the request fails.
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(generationId);
      else next.add(generationId);
      return next;
    });

    try {
      const response = isFav
        ? await fetch(`/api/favorites/${generationId}`, { method: "DELETE" })
        : await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ generationId }),
          });

      if (!response.ok) throw new Error();
      toast.success(isFav ? "Removed from favorites" : "Saved to favorites");
    } catch {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(generationId);
        else next.delete(generationId);
        return next;
      });
      toast.error("Could not update favorites.");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/history/${pendingDelete.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      setItems((prev) => prev.filter((g) => g.id !== pendingDelete.id));
      toast.success("Deleted");
      router.refresh();
    } catch {
      toast.error("Could not delete this generation.");
    } finally {
      setBusy(false);
      setPendingDelete(null);
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <Select value={toolFilter} onValueChange={setToolFilter}>
          <SelectTrigger className="sm:w-56" aria-label="Filter by tool">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tools</SelectItem>
            {usedTools.map((tool) => (
              <SelectItem key={tool.slug} value={tool.slug}>
                {tool.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="sm:w-44" aria-label="Filter by date">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="mb-3 text-xs text-muted-foreground" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "generation" : "generations"}
      </p>

      <ul className="space-y-3">
        {filtered.map((item) => {
          const tool = toolBySlug.get(item.tool_slug);
          const isOpen = expanded === item.id;
          const output =
            item.output_text ||
            (item.output_json ? JSON.stringify(item.output_json, null, 2) : "");

          return (
            <li
              key={item.id}
              className="rounded-xl border border-border bg-card"
            >
              <div className="flex items-start gap-3 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ToolIcon name={tool?.icon ?? "Sparkles"} className="h-4 w-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/tools/${item.tool_slug}`}
                      className="text-[13.5px] font-medium hover:text-primary"
                    >
                      {item.tool_name}
                    </Link>
                    {item.status === "failed" && (
                      <Badge variant="destructive">Failed</Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {formatDateTime(item.created_at)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      · {item.credits_used} credits
                    </span>
                  </div>

                  {item.input_preview && (
                    <p className="mt-1 truncate text-[13px] text-muted-foreground">
                      {item.input_preview}
                    </p>
                  )}
                  {!isOpen && output && (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/80">
                      {truncate(output, 160)}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => toggleFavorite(item.id)}
                    aria-label={
                      favorites.has(item.id)
                        ? "Remove from favorites"
                        : "Save to favorites"
                    }
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        favorites.has(item.id) && "fill-primary text-primary",
                      )}
                    />
                  </Button>
                  {output && <CopyButton value={output} size="icon-sm" variant="ghost" />}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setPendingDelete(item)}
                    aria-label="Delete generation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setExpanded(isOpen ? null : item.id)}
                    aria-expanded={isOpen}
                    aria-label={isOpen ? "Collapse result" : "Expand result"}
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isOpen && "rotate-180",
                      )}
                    />
                  </Button>
                </div>
              </div>

              {isOpen && output && (
                <div className="border-t border-border p-4">
                  {item.output_json ? (
                    <pre className="scroll-area max-h-96 overflow-auto rounded-lg bg-muted/40 p-4 font-mono text-[12.5px]">
                      {JSON.stringify(item.output_json, null, 2)}
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

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this generation?</DialogTitle>
            <DialogDescription>
              This removes it from your history permanently. The credits it used
              are not returned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" loading={busy} onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
