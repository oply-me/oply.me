"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Coins,
  CreditCard,
  FolderKanban,
  Gift,
  HelpCircle,
  History,
  LayoutGrid,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  Star,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { siteConfig } from "@/config/site";
import type { NotificationItem } from "@/lib/dashboard/notifications";
import { cn, formatNumber, initials } from "@/lib/utils";

const NAV = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "All Tools", href: "/dashboard/tools", icon: LayoutGrid },
  { title: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { title: "History", href: "/dashboard/history", icon: History },
  { title: "Activity", href: "/dashboard/activity", icon: Activity },
  { title: "Usage", href: "/dashboard/usage", icon: BarChart3 },
  { title: "Favorites", href: "/dashboard/favorites", icon: Star },
];

const ACCOUNT_NAV = [
  { title: "Credits", href: "/dashboard/credits", icon: Coins },
  { title: "Refer & earn", href: "/dashboard/referrals", icon: Gift },
  { title: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export interface SidebarUser {
  name: string | null;
  email: string;
  avatarUrl: string | null;
  isAdmin: boolean;
}

export function Sidebar({
  user,
  balance,
  notifications,
  unreadCount,
}: {
  user: SidebarUser;
  balance: number;
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const low = balance <= siteConfig.lowCreditThreshold;

  const content = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center justify-between px-5">
        <Link
          href="/dashboard"
          className="flex items-center"
          onClick={() => setMobileOpen(false)}
          aria-label="Oply dashboard"
        >
          <Logo />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-muted hover:bg-white/[0.06] hover:text-sidebar-foreground lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Dashboard">
        <ul className="space-y-0.5">
          {NAV.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href)
              }
              onNavigate={() => setMobileOpen(false)}
            />
          ))}
        </ul>

        <div>
          <p className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted/70">
            Account
          </p>
          <ul className="space-y-0.5">
            {ACCOUNT_NAV.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                active={pathname.startsWith(item.href)}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </ul>
        </div>

        {user.isAdmin && (
          <div>
            <p className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted/70">
              Admin
            </p>
            <ul className="space-y-0.5">
              <NavItem
                title="Admin panel"
                href="/admin"
                icon={Shield}
                active={pathname.startsWith("/admin")}
                onNavigate={() => setMobileOpen(false)}
              />
            </ul>
          </div>
        )}
      </nav>

      {/* Credit balance */}
      <div className="px-3 pb-2">
        {/* Real balance from `credit_balances` — there is no plan tier to
            upgrade to, so this promotes credits, which is what Oply sells. */}
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border p-4",
            low
              ? "border-warning/30 bg-warning/[0.08]"
              : "border-white/10 bg-gradient-to-br from-brand/25 via-brand/10 to-transparent",
          )}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-brand-2/30 blur-2xl"
          />
          <Link
            href="/dashboard/credits"
            onClick={() => setMobileOpen(false)}
            className="relative block"
          >
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">
              Credits
            </p>
            <p
              className={cn(
                "mt-1 text-2xl font-semibold tabular-nums text-white",
                low && "text-warning",
              )}
            >
              {formatNumber(balance)}
            </p>
          </Link>
          <p className="relative mt-1 text-[11px] leading-snug text-sidebar-muted">
            {low
              ? "You're running low. Tools stop at zero."
              : "Shared across every tool."}
          </p>
          <Button
            asChild
            size="sm"
            className="relative mt-3 w-full bg-gradient-to-r from-brand to-brand-2 text-white shadow-[0_8px_20px_-10px_hsl(var(--brand)/0.9)] hover:opacity-95"
          >
            <Link href="/pricing" onClick={() => setMobileOpen(false)}>
              Buy credits
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1 border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Avatar>
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
                <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">
                  {user.name ?? user.email.split("@")[0]}
                </span>
                <span className="block truncate text-[11px] text-sidebar-muted">
                  {user.email}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/credits">
                <Coins /> Credits
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/billing">
                <CreditCard /> Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/contact">
                <HelpCircle /> Help
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild destructive>
              <form action="/auth/signout" method="post" className="w-full">
                <button type="submit" className="flex w-full items-center gap-2">
                  <LogOut /> Log out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <NotificationBell
          items={notifications}
          unreadCount={unreadCount}
          className="text-sidebar-muted hover:bg-white/[0.06] hover:text-sidebar-foreground"
        />
        <ThemeToggle
          align="end"
          className="text-sidebar-muted hover:bg-white/[0.06] hover:text-sidebar-foreground"
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden print:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/dashboard" aria-label="Oply dashboard">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell items={notifications} unreadCount={unreadCount} />
          <Link
            href="/dashboard/credits"
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium tabular-nums",
              low ? "border-warning/40 text-warning" : "border-border text-muted-foreground",
            )}
          >
            {formatNumber(balance)}
          </Link>
        </div>
      </div>

      {/* Mobile drawer. Radix Dialog under the hood, so escape, the focus
          trap and scroll lock come for free; Framer gives it the spring. */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          portalClassName="lg:hidden"
          className="border-sidebar-border bg-sidebar"
        >
          <SheetTitle className="sr-only">Dashboard menu</SheetTitle>
          {content}
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] border-r border-sidebar-border bg-sidebar lg:block print:hidden">
        {content}
      </aside>
    </>
  );
}

function NavItem({
  title,
  href,
  icon: Icon,
  active,
  onNavigate,
}: {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-150",
          active
            ? "text-white"
            : "text-sidebar-muted hover:bg-white/[0.06] hover:text-sidebar-foreground",
        )}
      >
        {/* The active pill is its own layer so the gradient can sit under the
            label without tinting the icon or the text. */}
        {active && (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand/90 to-brand-2/80 shadow-[0_6px_18px_-8px_hsl(var(--brand)/0.9)]"
          />
        )}
        <Icon
          className={cn(
            "relative h-[17px] w-[17px] shrink-0 transition-transform duration-200",
            !active && "group-hover:scale-105",
          )}
          aria-hidden="true"
        />
        <span className="relative">{title}</span>
      </Link>
    </li>
  );
}
