import "server-only";

import { cookies } from "next/headers";
import { attachReferral, REFERRAL_COOKIE } from "@/lib/referrals";

/**
 * Attributes a newly created account, then clears the cookie.
 *
 * Split out of `lib/referrals.ts` because it touches the mutable cookie store,
 * which is only writable from a Route Handler or Server Action — importing it
 * into a Server Component would fail at runtime rather than at build.
 *
 * Attribution deliberately does NOT live in `handle_new_user()`. That trigger
 * can only see `raw_user_meta_data`, and it runs before any session exists, so
 * it has no way to distinguish a real referral link from a value the client
 * made up. Here the account is already authenticated and the code is resolved
 * against `referral_codes` by `attach_referral`.
 *
 * Two sources, because either alone loses attributions:
 *   - the `oply_ref` cookie, set by middleware when the link was followed;
 *   - `referral_code` in the user's signup metadata, which the signup page
 *     copies from that same cookie. This is the one that survives confirming
 *     the email in a different browser, where no cookie exists.
 * Both are client-influenced and both are safe, because a code is only ever a
 * lookup key — never an identity claim.
 */
export async function attachReferralFromRequest(
  userId: string,
  metadataCode?: string | null,
): Promise<boolean> {
  const store = await cookies();
  const cookieCode = store.get(REFERRAL_COOKIE)?.value;

  const attached =
    (await attachReferral(userId, cookieCode)) ||
    (await attachReferral(userId, metadataCode));

  // Cleared either way: a code that did not attach will not attach later, and
  // leaving it would keep re-running the lookup on every signup on this
  // browser.
  if (cookieCode) store.delete(REFERRAL_COOKIE);

  return attached;
}
