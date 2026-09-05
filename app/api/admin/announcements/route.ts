import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().min(1).max(120),
  message: z.string().min(1).max(400),
  link_url: z.string().max(500).nullable().optional(),
  link_label: z.string().max(60).nullable().optional(),
  ends_at: z.string().nullable().optional(),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  enabled: z.boolean().optional(),
  title: z.string().min(1).max(120).optional(),
  message: z.string().min(1).max(400).optional(),
});

export async function POST(request: Request) {
  const admin = await getApiAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid announcement." }, { status: 400 });
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from("announcements")
    .insert({
      title: parsed.data.title,
      message: parsed.data.message,
      link_url: parsed.data.link_url || null,
      link_label: parsed.data.link_label || null,
      ends_at: parsed.data.ends_at || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Could not create the announcement." },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}

export async function PATCH(request: Request) {
  const admin = await getApiAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { id, ...changes } = parsed.data;
  const db = createAdminClient();
  const { error } = await db.from("announcements").update(changes).eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Could not update the announcement." },
      { status: 500 },
    );
  }

  return NextResponse.json({ updated: true });
}

export async function DELETE(request: Request) {
  const admin = await getApiAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  const db = createAdminClient();
  const { error } = await db.from("announcements").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Could not delete the announcement." },
      { status: 500 },
    );
  }

  return NextResponse.json({ deleted: true });
}
