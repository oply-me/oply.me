import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getApiUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { changePasswordSchema } from "@/lib/security/validation";
import { getClientIp, rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * In-app password change.
 *
 * The current password is re-verified before the change, because a session
 * cookie alone is not proof of the password — an unattended logged-in browser
 * would otherwise be enough to lock the real owner out. Verification runs on a
 * throwaway anon client with `persistSession: false` so the check cannot
 * disturb (or silently re-issue) the caller's real session cookies.
 */
export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const limit = await rateLimit("credentials", `pw:${user.id}:${getClientIp(request)}`);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the form." },
      { status: 400 },
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: "That is already your current password." },
      { status: 400 },
    );
  }

  const verifier = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) {
    return NextResponse.json(
      { error: "That current password is not correct." },
      { status: 400 },
    );
  }
  await verifier.auth.signOut();

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return NextResponse.json(
      { error: error.message || "Could not update your password." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
