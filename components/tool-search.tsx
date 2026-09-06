"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { ToolSearchItem } from "@/lib/tools/search-item";
import { cn } from "@/lib/utils";

/* `cmdk` and the tool list only matter once the dialog is open, so they load
   then rather than in every page's initial bundle. */
const ToolSearchPalette = dynamic(
  () =>
    import("@/components/tool-search-palette").then((m) => m.ToolSearchPalette),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-24 items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

/**
 * Global tool search. Opens on Cmd/Ctrl+K anywhere it is mounted, and closes
 * on Escape (handled by the dialog primitive).
 */
export function ToolSearch({
  tools,
  trigger = "button",
  className,
}: {
  /**
   * Deliberately the compact shape, not `PublicTool`: the full definition
   * carries prompts, fields, FAQ and keyword layers, and serialising all 15 of
   * them into every page was 68KB of RSC payload for a palette that reads five
   * fields. See lib/tools/search-item.ts.
   */
  tools: ToolSearchItem[];
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
          <ToolSearchPalette tools={tools} onSelect={go} />
        </DialogContent>
      </Dialog>
    </>
  );
}
