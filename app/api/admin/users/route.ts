import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  userId: z.string().uuid(),
  disabled: z.boolean().optional(),
  role: z.enum(["user", "admin"]).optional(),
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
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // An admin cannot lock themselves out or drop their own role by accident.
  if (parsed.data.userId === admin.id) {
    return NextResponse.json(
      { error: "You cannot change your own role or status." },
      { status: 400 },
    );
  }

  const update: Partial<Profile> = {};
  if (parsed.data.disabled !== undefined) update.disabled = parsed.data.disabled;
  if (parsed.data.role !== undefined) update.role = parsed.data.role;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ updated: false });
  }

  const db = createAdminClient();
  const { error } = await db
    .from("profiles")
    .update(update)
    .eq("id", parsed.data.userId);

  if (error) {
    return NextResponse.json(
      { error: "Could not update the account." },
      { status: 500 },
    );
  }

  console.log("[admin/users] updated", {
    adminId: admin.id,
    userId: parsed.data.userId,
    update,
  });

  return NextResponse.json({ updated: true });
}
