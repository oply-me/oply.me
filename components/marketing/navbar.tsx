"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ToolSearch } from "@/components/tool-search";
import { ToolsMegaMenu } from "@/components/marketing/tools-mega-menu";
import { ToolTile } from "@/components/tools/tool-tile";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import type { ToolSearchItem } from "@/lib/tools/search-item";
import type { ToolsMenu } from "@/lib/tools/menu";
import { cn } from "@/lib/utils";

export function Navbar({
  signedIn = false,
  tools,
  menu,
}: {
  signedIn?: boolean;
  /** Compact list for the ⌘K palette — see lib/tools/search-item.ts. */
  tools: ToolSearchItem[];
  menu: ToolsMenu;
}) {
  const [open, setOpen] = useState(false);

  // "Tools" is rendered by the mega-menu instead of as a flat link.
  const flatNav = siteConfig.nav.filter((item) => item.href !== "/tools");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center rounded-md" aria-label="Oply home">
          <Logo />
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Main navigation"
        >
          <ToolsMegaMenu menu={menu} />
          {flatNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {/* The same ⌘K palette the dashboard uses. It only ever routes to
              public /tools/[slug] pages, so it works signed out unchanged. */}
          <ToolSearch tools={tools} className="w-[13rem] justify-start" />
          <ThemeToggle />
          {signedIn ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/pricing">Get Credits</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ToolSearch tools={tools} className="h-9 w-9 justify-center px-0" />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile. The tools panel is the same `menu` data as the desktop
          mega-menu, in an accordion, rather than a second list to maintain. */}
      <div
        id="mobile-menu"
        className={cn(
          "border-t border-border md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav
          className="container max-h-[calc(100dvh-8rem)] overflow-y-auto py-3"
          aria-label="Mobile navigation"
        >
          <Accordion type="single" collapsible>
            <AccordionItem value="tools" className="border-b-0">
              <AccordionTrigger className="px-3 py-2.5 text-[15px] font-medium hover:no-underline">
                Tools
              </AccordionTrigger>
              <AccordionContent>
                <Accordion type="single" collapsible className="pl-1">
                  {menu.categories.map((category) => (
                    <AccordionItem
                      key={category.slug}
                      value={category.slug}
                      className="border-b-0"
                    >
                      <AccordionTrigger className="px-3 py-2 text-[14px] font-medium text-muted-foreground hover:no-underline">
                        {category.name}
                        <span className="ml-auto mr-2 text-[11px] tabular-nums">
                          {category.toolCount}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-0.5 pb-1">
                          {category.tools.map((tool) => (
                            <li key={tool.slug}>
                              <Link
                                href={`/tools/${tool.slug}`}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2.5 rounded-md px-3 py-2 hover:bg-accent"
                              >
                                <ToolTile
                                  icon={tool.icon}
                                  category={category.slug}
                                  className="h-7 w-7 rounded-md"
                                  iconClassName="h-3.5 w-3.5"
                                />
                                <span className="truncate text-[14px]">
                                  {tool.name}
                                </span>
                              </Link>
                            </li>
                          ))}
                          <li>
                            <Link
                              href={`/categories/${category.slug}`}
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-1 px-3 py-2 text-[13px] font-medium text-primary"
                            >
                              All {category.name} tools
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <Link
                  href="/tools"
                  onClick={() => setOpen(false)}
                  className="mt-1 flex items-center gap-1 px-3 py-2 text-[14px] font-semibold text-primary"
                >
                  View all {menu.totalTools} tools
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {flatNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2.5 text-[15px] font-medium text-foreground hover:bg-accent"
            >
              {item.title}
            </Link>
          ))}

          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-4">
            {signedIn ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/pricing">Get Credits</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
