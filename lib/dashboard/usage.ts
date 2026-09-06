import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Per-user usage analytics.
 *
 * Everything here reads through the caller's own session-scoped client, so RLS
 * on `ai_generations` is what actually scopes the rows — the `user_id` filter
 * is defence in depth, not the security boundary.
 */

export interface UsagePoint {
  /** ISO date, YYYY-MM-DD. */
  date: string;
  credits: number;
  generations: number;
}

export interface ToolUsageSlice {
  slug: string;
  name: string;
  credits: number;
  generations: number;
}

export interface UsageSummary {
  series: UsagePoint[];
  byTool: ToolUsageSlice[];
  totalCredits: number;
  totalGenerations: number;
  failedGenerations: number;
  /** Credits returned by automatic refunds of failed generations. */
  refundedCredits: number;
  busiestDay: UsagePoint | null;
}

export const USAGE_RANGES = [30, 90] as const;
export type UsageRange = (typeof USAGE_RANGES)[number];

export function parseRange(value: string | undefined): UsageRange {
  return value === "90" ? 90 : 30;
}

/** UTC day key. The buckets and the row timestamps must agree on a timezone. */
function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export async function getUsageSummary(
  userId: string,
  days: UsageRange,
): Promise<UsageSummary> {
  const supabase = await createClient();
  const since = new Date(Date.now() - (days - 1) * 864e5);
  since.setUTCHours(0, 0, 0, 0);
  const sinceIso = since.toISOString();

  const [generationsResult, refundsResult] = await Promise.all([
    supabase
      .from("ai_generations")
      .select("created_at, credits_used, tool_slug, tool_name, status")
      .eq("user_id", userId)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: true }),
    // Automatic refunds for failed generations, so the page can say how much
    // came back rather than implying every charged credit was consumed.
    supabase
      .from("credit_transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("type", "refund")
      .gte("created_at", sinceIso),
  ]);

  const buckets = new Map<string, UsagePoint>();
  for (let i = days - 1; i >= 0; i--) {
    const key = dayKey(new Date(Date.now() - i * 864e5).toISOString());
    buckets.set(key, { date: key, credits: 0, generations: 0 });
  }

  const tools = new Map<string, ToolUsageSlice>();
  let totalCredits = 0;
  let totalGenerations = 0;
  let failedGenerations = 0;

  for (const row of generationsResult.data ?? []) {
    const credits = row.credits_used ?? 0;
    totalCredits += credits;
    totalGenerations += 1;
    if (row.status === "failed") failedGenerations += 1;

    const bucket = buckets.get(dayKey(row.created_at));
    if (bucket) {
      bucket.credits += credits;
      bucket.generations += 1;
    }

    const slice = tools.get(row.tool_slug) ?? {
      slug: row.tool_slug,
      // The generation row stores the name as it was at run time, which is what
      // should be shown for a tool that has since been renamed or disabled.
      name: row.tool_name,
      credits: 0,
      generations: 0,
    };
    slice.credits += credits;
    slice.generations += 1;
    tools.set(row.tool_slug, slice);
  }

  const series = [...buckets.values()];
  const busiestDay = series.reduce<UsagePoint | null>(
    (best, point) =>
      point.credits > 0 && (!best || point.credits > best.credits) ? point : best,
    null,
  );

  return {
    series,
    byTool: [...tools.values()].sort((a, b) => b.credits - a.credits),
    totalCredits,
    totalGenerations,
    failedGenerations,
    refundedCredits: (refundsResult.data ?? []).reduce(
      (sum, row) => sum + Math.abs(row.amount),
      0,
    ),
    busiestDay,
  };
}
