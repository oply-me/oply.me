"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { ToolCard } from "@/components/marketing/tool-card";
import { ToolCardSkeleton } from "@/components/marketing/tool-card-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryDefinition } from "@/config/categories";
import type { PublicTool } from "@/config/tools";
import { cn } from "@/lib/utils";

type SortKey = "curated" | "newest" | "az";

export function ToolsExplorer({
  tools,
  categories,
  initialQuery = "",
  initialCategory = "all",
}: {
  tools: PublicTool[];
  categories: CategoryDefinition[];
  initialQuery?: string;
  initialCategory?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState<SortKey>("curated");
  // Brief, honestly-framed transition between two real result sets — never
  // shown for search-box typing, since that filtering is instant and a fake
  // loading state there would be dishonest UI.
  const [switchingCategory, setSwitchingCategory] = useState(false);

  useEffect(() => {
    if (!switchingCategory) return;
    const id = setTimeout(() => setSwitchingCategory(false), 220);
    return () => clearTimeout(id);
  }, [switchingCategory]);

  function selectCategory(slug: string) {
    if (slug === category) return;
    setCategory(slug);
    setSwitchingCategory(true);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = tools.filter((tool) => {
      if (category !== "all" && tool.category !== category) return false;
      if (!q) return true;
      return [tool.name, tool.description, tool.tagline, tool.category, tool.slug]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });

    list = [...list].sort((a, b) => {
      if (sort === "az") return a.name.localeCompare(b.name);
      if (sort === "newest") {
        // Newest first, using the "New" window then sort order as a proxy.
        const aNew = a.newUntil ? new Date(a.newUntil).getTime() : 0;
        const bNew = b.newUntil ? new Date(b.newUntil).getTime() : 0;
        return bNew - aNew || b.sortOrder - a.sortOrder;
      }
      // "curated": the editorial order, and nothing else. `sortOrder` is what
      // /admin/tools edits, so it alone decides what leads the grid —
      // `featured` no longer reorders the list, it only drives the "Popular"
      // badge and the homepage showcase. Sorting featured tools to the front
      // here would have meant flagging a tool as popular to move it up.
      return a.sortOrder - b.sortOrder;
    });

    return list;
  }, [tools, query, category, sort]);

  // Pills follow the same curated order as the grid, so the category leading
  // the results is not the one sitting last in the filter row.
  const availableCategories = categories
    .filter((c) => tools.some((t) => t.category === c.slug))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools…"
            aria-label="Search tools"
            className="pl-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="sm:w-40" aria-label="Sort tools">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="curated">Recommended</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="az">A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div
        className="scroll-area mt-4 flex gap-2 overflow-x-auto pb-1"
        role="group"
        aria-label="Filter by category"
      >
        <FilterPill active={category === "all"} onClick={() => selectCategory("all")}>
          All
        </FilterPill>
        {availableCategories.map((c) => (
          <FilterPill
            key={c.slug}
            active={category === c.slug}
            onClick={() => selectCategory(c.slug)}
          >
            {c.label}
          </FilterPill>
        ))}
      </div>

      {switchingCategory ? (
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ToolCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-[15px] font-medium">No tools match that search.</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Try a different word, or clear the filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-5"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <p className="mt-6 text-xs text-muted-foreground" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "tool" : "tools"}
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {active && (
        <motion.span
          layoutId="active-filter-pill"
          className="absolute inset-0 bg-primary"
          transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
        />
      )}
      <span className="relative">{children}</span>
    </button>
  );
}
