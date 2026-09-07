import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Voids a fraudulent referral by reversing its reward.
 *
 * The admin check is done here against the database rather than trusted from
 * the caller, matching every other admin route in this project.
 */
export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user || user.profile?.role !== "admin") {
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const referredId = (body as { referredId?: unknown })?.referredId;
  if (typeof referredId !== "string" || !referredId) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const db = createAdminClient();
  const { data, error } = await db.rpc("reverse_referral_reward", {
    p_user_id: referredId,
  });

  if (error) {
    return NextResponse.json(
      { error: "Could not void this referral." },
      { status: 500 },
    );
  }

  return NextResponse.json({ reclaimed: data ?? 0 });
}
