import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export class InsufficientCreditsError extends Error {
  constructor(
    readonly required: number,
    readonly available: number,
  ) {
    super("insufficient_credits");
    this.name = "InsufficientCreditsError";
  }
}

export interface CreditSummary {
  balance: number;
  lifetimePurchased: number;
  lifetimeUsed: number;
}

/** Reads the signed-in user's balance through RLS. */
export async function getCreditSummary(userId: string): Promise<CreditSummary> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("credit_balances")
    .select("balance, lifetime_purchased, lifetime_used")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    balance: data?.balance ?? 0,
    lifetimePurchased: data?.lifetime_purchased ?? 0,
    lifetimeUsed: data?.lifetime_used ?? 0,
  };
}

/**
 * Reserves credits before an AI call. Atomic: the RPC locks the balance row,
 * so two concurrent requests cannot both pass the same balance check.
 *
 * Throws InsufficientCreditsError when the balance is too low.
 */
export async function reserveCredits(params: {
  userId: string;
  amount: number;
  description: string;
  referenceType?: string;
  referenceId?: string | null;
}): Promise<number> {
  const db = createAdminClient();

  const { data, error } = await db.rpc("consume_credits", {
    p_user_id: params.userId,
    p_amount: params.amount,
    p_description: params.description,
    p_reference_type: params.referenceType ?? "generation",
    p_reference_id: params.referenceId ?? null,
  });

  if (error) {
    if (
      error.message?.includes("insufficient_credits") ||
      error.code === "P0001"
    ) {
      const { data: bal } = await db
        .from("credit_balances")
        .select("balance")
        .eq("user_id", params.userId)
        .maybeSingle();
      throw new InsufficientCreditsError(params.amount, bal?.balance ?? 0);
    }
    throw error;
  }

  return data as unknown as number;
}

/**
 * Returns reserved credits after a failed generation. Best-effort: a refund
 * failure is logged but must never mask the original error from the caller.
 */
export async function refundCredits(params: {
  userId: string;
  amount: number;
  description: string;
  referenceType?: string;
  referenceId?: string | null;
}): Promise<number | null> {
  try {
    const db = createAdminClient();
    const { data, error } = await db.rpc("refund_credits", {
      p_user_id: params.userId,
      p_amount: params.amount,
      p_description: params.description,
      p_reference_type: params.referenceType ?? "generation",
      p_reference_id: params.referenceId ?? null,
    });
    if (error) throw error;
    return data as unknown as number;
  } catch (err) {
    console.error("[credits] refund failed", {
      userId: params.userId,
      amount: params.amount,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export async function getRecentTransactions(userId: string, limit = 20) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

/** Credits consumed by this user in the current calendar month. */
export async function getMonthlyUsage(userId: string): Promise<number> {
  const supabase = await createClient();
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("credit_transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("type", "usage")
    .gte("created_at", start.toISOString());

  return (data ?? []).reduce((sum, row) => sum + Math.abs(row.amount), 0);
}
