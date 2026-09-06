import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types/database";

/**
 * One reverse-chronological timeline over three tables.
 *
 * Deliberate omissions, so the same event never appears twice:
 *  - `credit_transactions.type = 'usage'` is skipped — that row *is* the
 *    generation, which is already listed from `ai_generations`.
 *  - `credit_transactions.type = 'purchase'` is skipped — that row is the
 *    credit half of an order, and the `orders` row carries more (plan, amount,
 *    provider), so the order is what gets shown.
 * Refunds, bonuses and admin adjustments have no other source, so they stay.
 *
 * Every read goes through the caller's session-scoped client; RLS is the
 * boundary, the `user_id` filters are defence in depth.
 */

export type ActivityKind =
  | "generation"
  | "generation_failed"
  | "order"
  | "refund"
  | "bonus"
  | "adjustment";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  createdAt: string;
  title: string;
  detail: string | null;
  /** Signed credit delta where the event moved credits, else null. */
  credits: number | null;
  href: string | null;
  /** Tool slug, for the rows that belong to a tool. */
  toolSlug: string | null;
}

export interface ActivityPage {
  items: ActivityItem[];
  /** Pass back as `before` to fetch the next page. Null when exhausted. */
  nextCursor: string | null;
}

export const ACTIVITY_PAGE_SIZE = 25;

const ORDER_STATUS_TITLE: Record<OrderStatus, string> = {
  pending: "Order started",
  processing: "Payment confirming",
  completed: "Credits purchased",
  failed: "Payment failed",
  expired: "Order expired",
  refunded: "Order refunded",
};

export async function getActivityPage(
  userId: string,
  before: string | null = null,
  limit: number = ACTIVITY_PAGE_SIZE,
): Promise<ActivityPage> {
  const supabase = await createClient();

  // Each source is asked for a full page. Merging then truncating means the
  // page is correct even when one source dominates the period.
  const generationsQuery = supabase
    .from("ai_generations")
    .select("id, created_at, tool_slug, tool_name, input_preview, credits_used, status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const transactionsQuery = supabase
    .from("credit_transactions")
    .select("id, created_at, type, amount, description")
    .eq("user_id", userId)
    .in("type", ["refund", "bonus", "admin_adjustment"])
    .order("created_at", { ascending: false })
    .limit(limit);

  const ordersQuery = supabase
    .from("orders")
    .select("id, created_at, plan_name, amount, currency, credits, status, payment_provider")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const [generations, transactions, orders] = await Promise.all([
    before ? generationsQuery.lt("created_at", before) : generationsQuery,
    before ? transactionsQuery.lt("created_at", before) : transactionsQuery,
    before ? ordersQuery.lt("created_at", before) : ordersQuery,
  ]);

  const items: ActivityItem[] = [];

  for (const row of generations.data ?? []) {
    const failed = row.status === "failed";
    items.push({
      id: `gen-${row.id}`,
      kind: failed ? "generation_failed" : "generation",
      createdAt: row.created_at,
      title: failed ? `${row.tool_name} failed` : row.tool_name,
      detail: row.input_preview,
      // A failed run's credits are returned by a separate refund row, so
      // showing a debit here as well would double-count it.
      credits: failed ? null : -(row.credits_used ?? 0),
      href: `/dashboard/history?tool=${row.tool_slug}`,
      toolSlug: row.tool_slug,
    });
  }

  for (const row of transactions.data ?? []) {
    const kind: ActivityKind =
      row.type === "refund"
        ? "refund"
        : row.type === "bonus"
          ? "bonus"
          : "adjustment";
    items.push({
      id: `tx-${row.id}`,
      kind,
      createdAt: row.created_at,
      title:
        kind === "refund"
          ? "Credits refunded"
          : kind === "bonus"
            ? "Bonus credits"
            : "Balance adjusted",
      detail: row.description,
      credits: row.amount,
      href: "/dashboard/credits",
      toolSlug: null,
    });
  }

  for (const row of orders.data ?? []) {
    const status = row.status as OrderStatus;
    items.push({
      id: `order-${row.id}`,
      kind: "order",
      createdAt: row.created_at,
      title: ORDER_STATUS_TITLE[status] ?? "Order",
      detail: `${row.plan_name} · ${row.currency} ${Number(row.amount).toFixed(2)}`,
      credits: status === "completed" ? row.credits : null,
      href: `/dashboard/billing`,
      toolSlug: null,
    });
  }

  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const page = items.slice(0, limit);
  const exhausted = items.length <= limit;

  return {
    items: page,
    // Keyset rather than offset, so a generation created mid-scroll cannot
    // shift the window and duplicate a row. Two rows sharing a timestamp to
    // the microsecond across tables would drop one; at per-user volumes that
    // has not been observed, and offset paging trades it for a worse bug.
    nextCursor: exhausted || page.length === 0
      ? null
      : (page[page.length - 1]?.createdAt ?? null),
  };
}
