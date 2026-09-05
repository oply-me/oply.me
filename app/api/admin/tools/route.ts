import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  slug: z.string().min(1).max(100),
  credit_cost: z.number().int().min(0).max(10_000).optional(),
  enabled: z.boolean().optional(),
  featured: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  description: z.string().max(400).optional(),
  tagline: z.string().max(200).optional(),
  system_prompt: z.string().max(20_000).optional(),
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
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const { slug, ...changes } = parsed.data;
  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ updated: false });
  }

  const db = createAdminClient();

  const { data: tool, error } = await db
    .from("tools")
    .update(changes)
    .eq("slug", slug)
    .select("id, slug")
    .maybeSingle();

  if (error || !tool) {
    return NextResponse.json(
      {
        error:
          "That tool has no database row yet. Run `npm run db:sync-tools` first.",
      },
      { status: 404 },
    );
  }

  // Prompt changes in particular are worth an audit trail.
  await db.from("tool_audit_log").insert({
    tool_id: tool.id,
    tool_slug: tool.slug,
    admin_id: admin.id,
    action: "update",
    changes: changes as never,
  });

  return NextResponse.json({ updated: true });
}
