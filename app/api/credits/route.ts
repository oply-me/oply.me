import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/guards";
import { getCreditSummary, getMonthlyUsage } from "@/lib/credits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Read-only. There is no endpoint anywhere that lets a client set a balance. */
export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const [summary, monthlyUsage] = await Promise.all([
    getCreditSummary(user.id),
    getMonthlyUsage(user.id),
  ]);

  return NextResponse.json({ ...summary, monthlyUsage });
}
