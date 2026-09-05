import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/security/validation";
import type { Profile } from "@/lib/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = profileSchema.extend({
  onboarded: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid profile." },
      { status: 400 },
    );
  }

  // Only these columns are ever written. `role`, `disabled` and `email` are
  // additionally pinned by a database trigger, so even a crafted request
  // cannot change them.
  const update: Partial<Profile> = {};
  if (parsed.data.full_name !== undefined) {
    update.full_name = parsed.data.full_name || null;
  }
  if (parsed.data.avatar_url !== undefined) {
    update.avatar_url = parsed.data.avatar_url || null;
  }
  if (parsed.data.primary_use_case !== undefined) {
    update.primary_use_case = parsed.data.primary_use_case || null;
  }
  if (parsed.data.onboarded) {
    update.onboarded_at = new Date().toISOString();
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ updated: false });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Could not save your profile." },
      { status: 500 },
    );
  }

  return NextResponse.json({ updated: true });
}
