import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getApiUser } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { deleteAccountSchema } from "@/lib/security/validation";
import { getClientIp, rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Self-serve account deletion. Irreversible.
 *
 * Two things here are worth stating plainly:
 *
 *  1. The password is re-verified first. Deleting an account is the most
 *     destructive action in the product, and a session cookie is not proof of
 *     the account owner.
 *
 *  2. This is the one user-facing path that touches the service-role client.
 *     `auth.users` rows cannot be deleted through RLS by anyone — only the
 *     admin API can — so the alternative would be an orphaned login with no
 *     data behind it. The admin client is used for exactly one call, on an id
 *     that came from the verified session and nowhere else. Everything in
 *     `public` cascades from `auth.users` (profiles → balances, transactions,
 *     orders, generations, favorites, projects), so no manual cleanup runs.
 */
export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const limit = await rateLimit(
    "credentials",
    `del:${user.id}:${getClientIp(request)}`,
  );
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

  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Type DELETE and enter your password to confirm." },
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
    password: parsed.data.password,
  });
  if (verifyError) {
    return NextResponse.json(
      { error: "That password is not correct." },
      { status: 400 },
    );
  }
  await verifier.auth.signOut();

  // An admin must not be able to delete themselves out from under the panel.
  if (user.profile?.role === "admin") {
    return NextResponse.json(
      {
        error:
          "Admin accounts cannot be deleted here. Contact another admin to have the role removed first.",
      },
      { status: 403 },
    );
  }

  let db;
  try {
    db = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Account deletion is not available on this deployment." },
      { status: 503 },
    );
  }

  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json(
      { error: "Could not delete the account. Please contact support." },
      { status: 500 },
    );
  }

  // Clear the now-dangling session cookies.
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
