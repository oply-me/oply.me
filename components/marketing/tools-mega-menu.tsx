"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { ToolIcon } from "@/components/icon";
import { ToolTile } from "@/components/tools/tool-tile";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { categoryColors } from "@/config/categories";
import type { ToolsMenu } from "@/lib/tools/menu";
import { cn } from "@/lib/utils";

/** Grace period so a diagonal mouse path to the panel doesn't close it. */
const CLOSE_DELAY_MS = 120;

/**
 * The header's Tools panel. Opens on hover for a mouse and on click/tap for
 * everything else; a hover-open deliberately does not steal focus, so keyboard
 * users get the click behaviour and nothing jumps under a passing cursor.
 */
export function ToolsMegaMenu({ menu }: { menu: ToolsMenu }) {
  const [open, setOpen] = useState(false);
  const openedByHover = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openByHover() {
    cancelClose();
    openedByHover.current = true;
    setOpen(true);
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) openedByHover.current = false;
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Tools menu"
          onPointerEnter={(e) => e.pointerType === "mouse" && openByHover()}
          onPointerLeave={(e) => e.pointerType === "mouse" && scheduleClose()}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            open ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Tools
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={10}
        className="w-[min(92vw,52rem)] p-0"
        onPointerEnter={cancelClose}
        onPointerLeave={scheduleClose}
        onOpenAutoFocus={(event) => {
          // A hover must not yank focus out of the page.
          if (openedByHover.current) event.preventDefault();
        }}
      >
        {/* Capped and scrollable: five categories on three columns is two
            rows, which ran past the bottom of a laptop viewport and cut off
            the "View all" row below. */}
        <div className="grid max-h-[min(68vh,30rem)] gap-x-6 gap-y-6 overflow-y-auto p-5 sm:grid-cols-2 lg:grid-cols-3">
          {menu.categories.map((category) => {
            const c = categoryColors(category.slug);
            return (
              <div key={category.slug}>
                <Link
                  href={`/categories/${category.slug}`}
                  onClick={() => setOpen(false)}
                  className="group mb-2.5 flex items-center gap-2"
                >
                  <span
                    aria-hidden="true"
                    style={{ backgroundImage: c.tile }}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-white shadow-sm"
                  >
                    <ToolIcon name={category.icon} className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[13px] font-semibold group-hover:underline">
                    {category.name}
                  </span>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {category.toolCount}
                  </span>
                </Link>

                <ul className="space-y-0.5">
                  {category.tools.map((tool) => (
                    <li key={tool.slug}>
                      <Link
                        href={`/tools/${tool.slug}`}
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-accent"
                      >
                        <ToolTile
                          icon={tool.icon}
                          category={category.slug}
                          className="mt-0.5 h-6 w-6 rounded-md"
                          iconClassName="h-3 w-3"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium">
                            {tool.name}
                          </span>
                          <span className="block truncate text-[11.5px] text-muted-foreground">
                            {tool.tagline}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border bg-muted/30 px-5 py-3">
          <p className="text-[12px] text-muted-foreground">
            One credit balance across every tool.
          </p>
          <Link
            href="/tools"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
          >
            View all {menu.totalTools} tools
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
