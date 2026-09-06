"use client";

import { Command } from "cmdk";
import { Search } from "lucide-react";
import { ToolTile } from "@/components/tools/tool-tile";
import { categoryMap } from "@/config/categories";
import type { ToolSearchItem } from "@/lib/tools/search-item";

/**
 * The palette body, split out so `cmdk` can be lazy-loaded.
 *
 * It only ever renders inside an open dialog, but a static import still put
 * the library in the initial bundle of every marketing and dashboard page.
 * `ToolSearch` pulls this in with `next/dynamic` on first open instead.
 */
export function ToolSearchPalette({
  tools,
  onSelect,
}: {
  tools: ToolSearchItem[];
  onSelect: (href: string) => void;
}) {
  return (
    <Command
      className="[&_[cmdk-input-wrapper]]:border-b [&_[cmdk-input-wrapper]]:border-border"
      loop
    >
      <div cmdk-input-wrapper="" className="flex items-center gap-2 px-4">
        <Search
          className="h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <Command.Input
          autoFocus
          placeholder="Search tools by name, category or task…"
          className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
      </div>
      <Command.List className="scroll-area max-h-80 overflow-y-auto p-2">
        <Command.Empty className="py-10 text-center text-sm text-muted-foreground">
          No tools match that search.
        </Command.Empty>
        {tools.map((tool) => (
          <Command.Item
            key={tool.slug}
            value={`${tool.name} ${tool.description} ${tool.category} ${tool.slug}`}
            onSelect={() => onSelect(`/tools/${tool.slug}`)}
            className="flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2.5 text-sm data-[selected=true]:bg-accent"
          >
            <ToolTile
              icon={tool.icon}
              category={tool.category}
              className="h-8 w-8 rounded-md"
            />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{tool.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {tool.description}
              </span>
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {categoryMap.get(tool.category)?.name ?? tool.category}
            </span>
          </Command.Item>
        ))}
      </Command.List>
    </Command>
  );
}
