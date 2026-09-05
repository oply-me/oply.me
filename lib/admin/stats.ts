import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export interface AdminOverview {
  totalUsers: number;
  newUsers7d: number;
  totalRevenue: number;
  completedOrders: number;
  pendingOrders: number;
  creditsSold: number;
  creditsConsumed: number;
  generations: number;
  generations7d: number;
  estimatedAiCost: number;
  /** Provider fee estimate — a configurable assumption, not a billed figure. */
  estimatedPaymentFees: number;
  estimatedGrossMargin: number;
}

/** Assumed provider fee rate, used only for the margin estimate. */
const PAYMENT_FEE_RATE = Number(process.env.PAYMENT_FEE_RATE ?? 0.01);

export async function getAdminOverview(): Promise<AdminOverview> {
  const db = createAdminClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 864e5).toISOString();

  const [
    users,
    newUsers,
    orders,
    generations,
    recentGenerations,
    usage,
    transactions,
  ] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    db.from("orders").select("amount, credits, status"),
    db.from("ai_generations").select("id", { count: "exact", head: true }),
    db
      .from("ai_generations")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    db.from("ai_usage").select("estimated_cost_usd"),
    db.from("credit_transactions").select("amount").eq("type", "usage"),
  ]);

  const orderRows = orders.data ?? [];
  const completed = orderRows.filter((o) => o.status === "completed");

  const totalRevenue = completed.reduce((sum, o) => sum + Number(o.amount), 0);
  const creditsSold = completed.reduce((sum, o) => sum + o.credits, 0);
  const creditsConsumed = (transactions.data ?? []).reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0,
  );
  const estimatedAiCost = (usage.data ?? []).reduce(
    (sum, u) => sum + Number(u.estimated_cost_usd ?? 0),
    0,
  );
  const estimatedPaymentFees = totalRevenue * PAYMENT_FEE_RATE;

  return {
    totalUsers: users.count ?? 0,
    newUsers7d: newUsers.count ?? 0,
    totalRevenue,
    completedOrders: completed.length,
    pendingOrders: orderRows.filter(
      (o) => o.status === "pending" || o.status === "processing",
    ).length,
    creditsSold,
    creditsConsumed,
    generations: generations.count ?? 0,
    generations7d: recentGenerations.count ?? 0,
    estimatedAiCost,
    estimatedPaymentFees,
    estimatedGrossMargin: totalRevenue - estimatedAiCost - estimatedPaymentFees,
  };
}

export interface TimeSeriesPoint {
  date: string;
  users: number;
  revenue: number;
  generations: number;
}

/** Daily counts for the last `days` days, oldest first. */
export async function getTimeSeries(days = 30): Promise<TimeSeriesPoint[]> {
  const db = createAdminClient();
  const since = new Date(Date.now() - days * 864e5);
  const sinceIso = since.toISOString();

  const [users, orders, generations] = await Promise.all([
    db.from("profiles").select("created_at").gte("created_at", sinceIso),
    db
      .from("orders")
      .select("created_at, amount")
      .eq("status", "completed")
      .gte("created_at", sinceIso),
    db.from("ai_generations").select("created_at").gte("created_at", sinceIso),
  ]);

  const buckets = new Map<string, TimeSeriesPoint>();
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    buckets.set(key, { date: key, users: 0, revenue: 0, generations: 0 });
  }

  for (const row of users.data ?? []) {
    const bucket = buckets.get(row.created_at.slice(0, 10));
    if (bucket) bucket.users += 1;
  }
  for (const row of orders.data ?? []) {
    const bucket = buckets.get(row.created_at.slice(0, 10));
    if (bucket) bucket.revenue += Number(row.amount);
  }
  for (const row of generations.data ?? []) {
    const bucket = buckets.get(row.created_at.slice(0, 10));
    if (bucket) bucket.generations += 1;
  }

  return [...buckets.values()];
}

export interface ToolUsageRow {
  slug: string;
  generations: number;
  creditsConsumed: number;
  estimatedCost: number;
}

export async function getToolUsage(): Promise<ToolUsageRow[]> {
  const db = createAdminClient();
  const { data } = await db
    .from("ai_usage")
    .select("tool_slug, credits_charged, estimated_cost_usd")
    .limit(10000);

  const map = new Map<string, ToolUsageRow>();
  for (const row of data ?? []) {
    const slug = row.tool_slug ?? "unknown";
    const entry = map.get(slug) ?? {
      slug,
      generations: 0,
      creditsConsumed: 0,
      estimatedCost: 0,
    };
    entry.generations += 1;
    entry.creditsConsumed += row.credits_charged ?? 0;
    entry.estimatedCost += Number(row.estimated_cost_usd ?? 0);
    map.set(slug, entry);
  }

  return [...map.values()].sort((a, b) => b.generations - a.generations);
}
