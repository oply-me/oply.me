"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CircleAlert, CreditCard, RotateCcw } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { NotificationItem, NotificationKind } from "@/lib/dashboard/notifications";
import { cn, timeAgo } from "@/lib/utils";

const ICON: Record<NotificationKind, typeof Bell> = {
  low_balance: CircleAlert,
  refund: RotateCcw,
  order_completed: CreditCard,
};

/**
 * Only ever shows what `getNotifications` found in the database — there is no
 * client-side synthesis here, and an empty feed says so rather than inventing
 * filler.
 */
export function NotificationBell({
  items,
  unreadCount,
  className,
}: {
  items: NotificationItem[];
  unreadCount: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(unreadCount);

  async function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next || unread === 0) return;
    // Optimistic: the badge is a convenience, and a failed write just means
    // it reappears on the next load.
    setUnread(0);
    try {
      await fetch("/api/notifications/seen", { method: "POST" });
    } catch {
      /* ignore */
    }
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
          }
          className={cn(
            "relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <Bell className="h-4 w-4" />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                initial={reduceMotion ? { opacity: 0 } : { scale: 0.4, opacity: 0 }}
                animate={reduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { scale: 0.4, opacity: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 520, damping: 26 }
                }
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold tabular-nums text-primary-foreground"
              >
                {unread > 9 ? "9+" : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" side="top" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="text-[13px] font-semibold">Notifications</p>
        </div>

        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">
            Nothing to report. Refunds and completed purchases show up here.
          </p>
        ) : (
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {items.map((item) => {
              const Icon = ICON[item.kind];
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex gap-3 px-4 py-3 transition-colors hover:bg-accent"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        item.kind === "low_balance"
                          ? "bg-warning/15 text-warning"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-[12px] leading-relaxed text-muted-foreground">
                        {item.body}
                      </span>
                      {item.createdAt && (
                        <span className="mt-1 block text-[11px] text-muted-foreground">
                          {timeAgo(item.createdAt)}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="border-t border-border px-4 py-2.5">
          <Link
            href="/dashboard/activity"
            onClick={() => setOpen(false)}
            className="text-[12px] font-medium text-primary hover:underline"
          >
            View all activity
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
