"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { title: "Overview", href: "/admin" },
  { title: "Users", href: "/admin/users" },
  { title: "Orders", href: "/admin/orders" },
  { title: "Payments", href: "/admin/payments" },
  { title: "Tools", href: "/admin/tools" },
  { title: "Usage", href: "/admin/usage" },
  { title: "Credits", href: "/admin/credits" },
  { title: "Settings", href: "/admin/settings" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      className="scroll-area flex gap-1 overflow-x-auto px-4 pb-2 sm:px-6"
      aria-label="Admin sections"
    >
      {LINKS.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {link.title}
          </Link>
        );
      })}
    </nav>
  );
}
