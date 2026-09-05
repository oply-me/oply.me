import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  // The delete policy on ai_generations is scoped to auth.uid(), so this
  // cannot touch another user's row even with a guessed id.
  const supabase = await createClient();
  const { error } = await supabase
    .from("ai_generations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Could not delete this generation." },
      { status: 500 },
    );
  }

  return NextResponse.json({ deleted: true });
}
