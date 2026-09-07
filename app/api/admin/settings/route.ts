import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  signup_bonus_credits: z.number().int().min(0).max(10_000).optional(),
  low_credit_threshold: z.number().int().min(0).max(100_000).optional(),
  ai_rate_limit_per_min: z.number().int().min(1).max(1_000).optional(),
  support_email: z.string().email().max(200).optional(),
  maintenance_mode: z.boolean().optional(),
  referral_enabled: z.boolean().optional(),
  /* Capped well below a pack so a mistyped rate cannot mint a fortune. */
  referral_reward_credits: z.number().int().min(0).max(10_000).optional(),
  referral_referred_bonus_credits: z.number().int().min(0).max(10_000).optional(),
});

export async function PATCH(request: Request) {
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
      { error: parsed.error.issues[0]?.message ?? "Invalid settings." },
      { status: 400 },
    );
  }

  const db = createAdminClient();
  const rows = Object.entries(parsed.data).map(([key, value]) => ({
    key,
    value: value as never,
    updated_at: new Date().toISOString(),
  }));

  if (rows.length === 0) return NextResponse.json({ updated: false });

  const { error } = await db.from("site_settings").upsert(rows);

  if (error) {
    return NextResponse.json(
      { error: "Could not save settings." },
      { status: 500 },
    );
  }

  console.log("[admin/settings] updated", {
    adminId: admin.id,
    keys: Object.keys(parsed.data),
  });

  return NextResponse.json({ updated: true });
}
