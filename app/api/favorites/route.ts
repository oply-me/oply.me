import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ generationId: z.string().uuid() });

export async function POST(request: Request) {
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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const supabase = await createClient();

  // RLS on ai_generations means this only finds the caller's own rows, so a
  // user cannot favorite (and thereby read) someone else's generation.
  const { data: generation } = await supabase
    .from("ai_generations")
    .select("id")
    .eq("id", parsed.data.generationId)
    .maybeSingle();

  if (!generation) {
    return NextResponse.json({ error: "Result not found." }, { status: 404 });
  }

  const { error } = await supabase.from("favorites").insert({
    user_id: user.id,
    generation_id: parsed.data.generationId,
  });

  // 23505 = already favorited, which is a no-op rather than an error.
  if (error && error.code !== "23505") {
    return NextResponse.json(
      { error: "Could not save this result." },
      { status: 500 },
    );
  }

  return NextResponse.json({ saved: true });
}

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("favorites")
    .select("id, generation_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ favorites: data ?? [] });
}
