"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import { ToolIcon } from "@/components/icon";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { PublicTool } from "@/config/tools";
import { categoryMap } from "@/config/categories";
import { cn } from "@/lib/utils";

/**
 * Global tool search. Opens on Cmd/Ctrl+K anywhere it is mounted, and closes
 * on Escape (handled by the dialog primitive).
 */
export function ToolSearch({
  tools,
  trigger = "button",
  className,
}: {
  tools: PublicTool[];
  trigger?: "button" | "hidden";
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      {trigger === "button" && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Search tools</span>
          <kbd className="ml-2 hidden rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium sm:inline-block">
            ⌘K
          </kbd>
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-xl" hideClose>
          <DialogTitle className="sr-only">Search tools</DialogTitle>
          <Command
            className="[&_[cmdk-input-wrapper]]:border-b [&_[cmdk-input-wrapper]]:border-border"
            loop
          >
            <div
              cmdk-input-wrapper=""
              className="flex items-center gap-2 px-4"
            >
              <Search
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <Command.Input
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
                  onSelect={() => go(`/tools/${tool.slug}`)}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2.5 text-sm data-[selected=true]:bg-accent"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <ToolIcon name={tool.icon} className="h-4 w-4" />
                  </span>
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
        </DialogContent>
      </Dialog>
    </>
  );
}
