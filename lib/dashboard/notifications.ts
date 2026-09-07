import "server-only";

import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";

/**
 * The dashboard bell.
 *
 * There is no `notifications` table and no content pipeline, and inventing one
 * would mean a bell that announces nothing. So this reads the three signals
 * the database can already answer honestly, and nothing else:
 *
 *   - the balance is at or below `lowCreditThreshold`
 *   - a generation failed and its credits were refunded
 *   - an order completed and credits landed
 *   - a referral qualified and paid out
 *
 * Low balance is a standing condition rather than an event, so it is listed
 * but deliberately does not drive the unread badge — the sidebar already
 * carries a permanent low-balance card and a Buy Credits button, and a badge
 * that can never be cleared is just nagging.
 */

const WINDOW_DAYS = 30;

export type NotificationKind =
  | "low_balance"
  | "refund"
  | "order_completed"
  | "referral_earned";

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string | null;
  href: string;
  /** Standing conditions never count as unread. See the note above. */
  countsAsUnread: boolean;
}

export interface NotificationFeed {
  items: NotificationItem[];
  unreadCount: number;
}

export async function getNotifications(
  userId: string,
  balance: number,
  seenAt: string | null,
): Promise<NotificationFeed> {
  const supabase = await createClient();
  const sinceIso = new Date(Date.now() - WINDOW_DAYS * 864e5).toISOString();

  const [refunds, orders, referralRewards] = await Promise.all([
    supabase
      .from("credit_transactions")
      .select("id, amount, description, created_at")
      .eq("user_id", userId)
      .eq("type", "refund")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("orders")
      .select("id, plan_name, credits, completed_at, created_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(10),
    // A referral paying out is a real event the user would otherwise only
    // discover by opening the referrals page.
    supabase
      .from("referral_rewards")
      .select("id, credits, granted_at")
      .eq("user_id", userId)
      .gte("granted_at", sinceIso)
      .order("granted_at", { ascending: false })
      .limit(10),
  ]);

  const items: NotificationItem[] = [];

  if (balance <= siteConfig.lowCreditThreshold) {
    items.push({
      id: "low-balance",
      kind: "low_balance",
      title: "Your credit balance is low",
      body: `You have ${balance} credits left. Tools stop running at zero.`,
      createdAt: null,
      href: "/pricing",
      countsAsUnread: false,
    });
  }

  for (const row of refunds.data ?? []) {
    items.push({
      id: `refund-${row.id}`,
      kind: "refund",
      title: `${Math.abs(row.amount)} credits refunded`,
      body: row.description ?? "A generation failed, so its credits were returned.",
      createdAt: row.created_at,
      href: "/dashboard/credits",
      countsAsUnread: true,
    });
  }

  for (const row of orders.data ?? []) {
    // `completed_at` is when the credits actually landed; fall back to
    // created_at only for rows written before that column was populated.
    const at = row.completed_at ?? row.created_at;
    items.push({
      id: `order-${row.id}`,
      kind: "order_completed",
      title: `${row.credits} credits added`,
      body: `Your ${row.plan_name} purchase completed.`,
      createdAt: at,
      href: "/dashboard/billing",
      countsAsUnread: true,
    });
  }

  for (const row of referralRewards.data ?? []) {
    items.push({
      id: `referral-${row.id}`,
      kind: "referral_earned",
      title: `${row.credits} referral credits earned`,
      body: "Someone you referred made their first purchase.",
      createdAt: row.granted_at,
      href: "/dashboard/referrals",
      countsAsUnread: true,
    });
  }

  items.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  const unreadCount = items.filter(
    (item) =>
      item.countsAsUnread &&
      item.createdAt !== null &&
      (seenAt === null || item.createdAt > seenAt),
  ).length;

  return { items, unreadCount };
}
