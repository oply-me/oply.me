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
    <div className="flex h-full flex-col">
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
          className="lg:hidden"
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
          <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
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
            <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
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
        <Link
          href="/dashboard/credits"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "block rounded-lg border p-3.5 transition-colors",
            low
              ? "border-warning/40 bg-warning/5 hover:bg-warning/10"
              : "border-border bg-card hover:bg-accent",
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Credits
          </p>
          <p
            className={cn(
              "mt-1 text-xl font-semibold tabular-nums",
              low && "text-warning",
            )}
          >
            {formatNumber(balance)}
          </p>
          {low && (
            <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
              You&apos;re running low on credits.
            </p>
          )}
        </Link>
        {low && (
          <Button asChild size="sm" className="mt-2 w-full">
            <Link href="/pricing" onClick={() => setMobileOpen(false)}>
              Buy Credits
            </Link>
          </Button>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1 border-t border-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar>
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
                <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">
                  {user.name ?? user.email.split("@")[0]}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
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
        <NotificationBell items={notifications} unreadCount={unreadCount} />
        <ThemeToggle align="end" />
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
        <SheetContent side="left" portalClassName="lg:hidden">
          <SheetTitle className="sr-only">Dashboard menu</SheetTitle>
          {content}
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] border-r border-border bg-surface lg:block print:hidden">
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
          "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {title}
      </Link>
    </li>
  );
}
