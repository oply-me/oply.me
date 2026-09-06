import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Marks the bell as read. Writes through RLS to the caller's own profile. */
export async function POST() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const supabase = await createClient();
  const seenAt = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({ notifications_seen_at: seenAt })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Could not update notifications." },
      { status: 500 },
    );
  }

  return NextResponse.json({ seenAt });
}
