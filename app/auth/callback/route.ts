import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { attachReferralFromRequest } from "@/lib/referrals-attach";
import { absoluteUrl } from "@/lib/utils";

/** Exchanges the emailed code for a session, then continues to `next`. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Only same-origin paths are honoured, so the link cannot be used as an
  // open redirect.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // First point at which a confirmed account has a session, so it is where
      // a referral can be attributed. Never allowed to fail the sign-in.
      if (data.user) {
        await attachReferralFromRequest(
          data.user.id,
          typeof data.user.user_metadata?.referral_code === "string"
            ? data.user.user_metadata.referral_code
            : null,
        ).catch(() => false);
      }
      // Built from NEXT_PUBLIC_APP_URL, not the request's Host header: see
      // the note in app/auth/signout/route.ts.
      return NextResponse.redirect(absoluteUrl(safeNext));
    }
  }

  return NextResponse.redirect(absoluteUrl("/login?error=auth_callback_failed"));
}
