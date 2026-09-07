import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/guards";
import { attachReferralFromRequest } from "@/lib/referrals-attach";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Attribution for the flow where signup returns a session immediately (email
 * confirmation disabled). The confirmation flow is handled in
 * `/auth/callback`; both call the same helper and both are idempotent, since
 * `referrals` is unique on `referred_id`.
 *
 * Takes no body — the code comes from the cookie or the caller's own signup
 * metadata, never from the request, so there is nothing here to forge.
 */
export async function POST() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const metadataCode = data.user?.user_metadata?.referral_code;

  const attached = await attachReferralFromRequest(
    user.id,
    typeof metadataCode === "string" ? metadataCode : null,
  );

  return NextResponse.json({ attached });
}
