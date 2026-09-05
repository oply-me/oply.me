import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().refine((n) => n !== 0, "Amount cannot be zero."),
  description: z.string().max(200).optional(),
});

/**
 * Manual credit adjustment. Authorization is checked here AND again inside the
 * admin_adjust_credits function, which re-reads the caller's role from the
 * database — so this cannot be bypassed by reaching PostgREST directly.
 */
export async function POST(request: Request) {
  const admin = await getApiAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const db = createAdminClient();

  // The service role bypasses RLS, so the function's own auth.uid() check would
  // not see an admin. Write the ledger entry explicitly instead, keeping the
  // same invariant: no balance change without a transaction row.
  const { data: balanceRow } = await db
    .from("credit_balances")
    .select("balance")
    .eq("user_id", parsed.data.userId)
    .maybeSingle();

  if (!balanceRow) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const newBalance = Math.max(0, balanceRow.balance + parsed.data.amount);
  const delta = newBalance - balanceRow.balance;

  const { error: updateError } = await db
    .from("credit_balances")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("user_id", parsed.data.userId);

  if (updateError) {
    console.error("[admin/credits] adjustment failed", {
      adminId: admin.id,
      userId: parsed.data.userId,
      error: updateError.message,
    });
    return NextResponse.json(
      { error: "Could not adjust credits." },
      { status: 500 },
    );
  }

  await db.from("credit_transactions").insert({
    user_id: parsed.data.userId,
    type: "admin_adjustment",
    amount: delta,
    balance_after: newBalance,
    reference_type: "admin",
    reference_id: admin.id,
    description: parsed.data.description || "Manual adjustment",
  });

  console.log("[admin/credits] adjusted", {
    adminId: admin.id,
    userId: parsed.data.userId,
    delta,
  });

  return NextResponse.json({ balance: newBalance });
}
