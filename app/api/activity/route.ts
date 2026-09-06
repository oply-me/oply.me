import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/guards";
import { ACTIVITY_PAGE_SIZE, getActivityPage } from "@/lib/dashboard/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Next page of the activity timeline. Keyset cursor, see lib/dashboard/activity.ts. */
export async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const before = new URL(request.url).searchParams.get("before");
  if (before && Number.isNaN(Date.parse(before))) {
    return NextResponse.json({ error: "Invalid cursor." }, { status: 400 });
  }

  const page = await getActivityPage(user.id, before, ACTIVITY_PAGE_SIZE);
  return NextResponse.json(page);
}
