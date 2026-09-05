import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tool = searchParams.get("tool");
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

  const supabase = await createClient();
  let query = supabase
    .from("ai_generations")
    .select(
      "id, tool_slug, tool_name, input_preview, output_text, credits_used, status, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (tool) query = query.eq("tool_slug", tool);

  const { data } = await query;
  return NextResponse.json({ generations: data ?? [] });
}
