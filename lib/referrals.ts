import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Referral program.
 *
 * Reads go through the caller's session client, so RLS
 * (`referrals_own` / `referral_rewards_own`) is what scopes them. Writes go
 * through the SECURITY DEFINER functions in
 * `supabase/migrations/20250104000000_referral_program.sql` — never a direct
 * insert, because the RLS on these tables grants SELECT only and that is the
 * point: a user must not be able to author their own reward.
 */

/** Cookie the middleware drops when a `?ref=` link is followed. */
export const REFERRAL_COOKIE = "oply_ref";
/** A referral link is worth remembering for a while, but not forever. */
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/** Codes are shown to humans, so no 0/O/1/I/L. */
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 8;

/** Loose shape check before a value is worth a database round trip. */
export function isPlausibleReferralCode(value: string): boolean {
  return new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`).test(
    value.trim().toUpperCase(),
  );
}

function generateCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const byte of bytes) out += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return out;
}

export interface ReferralSettings {
  enabled: boolean;
  rewardCredits: number;
  referredBonusCredits: number;
}

/**
 * Program rates. Stored in `site_settings` beside `signup_bonus_credits` so a
 * rate change is an admin edit rather than a deploy — and so the number shown
 * on the marketing page is read from the same row that pays it out, and cannot
 * drift into a claim that is not honoured.
 */
export async function getReferralSettings(): Promise<ReferralSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", [
      "referral_enabled",
      "referral_reward_credits",
      "referral_referred_bonus_credits",
    ]);

  const map = new Map((data ?? []).map((row) => [row.key, row.value]));
  const num = (key: string, fallback: number) => {
    const raw = map.get(key);
    const parsed = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  return {
    enabled: map.get("referral_enabled") !== false,
    rewardCredits: num("referral_reward_credits", 0),
    referredBonusCredits: num("referral_referred_bonus_credits", 0),
  };
}

/**
 * The caller's own code, created on first use.
 *
 * Lazy rather than at signup: most accounts never open the referrals page, and
 * a code that is never shown does not need to exist. The retry covers the
 * unique-collision case rather than assuming 31^8 makes it impossible.
 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("referral_codes")
    .select("code")
    .eq("user_id", userId)
    .eq("enabled", true)
    .limit(1)
    .maybeSingle();

  if (existing?.code) return existing.code;

  const db = createAdminClient();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { error } = await db
      .from("referral_codes")
      .insert({ user_id: userId, code });

    if (!error) return code;
    // 23505 is the unique violation on `code`; anything else is a real error.
    if (error.code !== "23505") throw error;

    // The collision may have been this user racing themselves in two tabs.
    const { data: raced } = await db
      .from("referral_codes")
      .select("code")
      .eq("user_id", userId)
      .eq("enabled", true)
      .limit(1)
      .maybeSingle();
    if (raced?.code) return raced.code;
  }

  throw new Error("could not allocate a referral code");
}

/**
 * Records who referred `userId`, if a valid code is supplied.
 *
 * The code is untrusted input by design — it arrives from a cookie or from
 * signup metadata, both of which the client controls. That is safe because a
 * code is only ever a lookup key: `attach_referral` resolves it against
 * `referral_codes` and refuses self-referral, an aliased duplicate of the
 * referrer's own mailbox, and any account that already has a referrer. A
 * referrer *id* from the client would be an identity claim and is never
 * accepted anywhere.
 *
 * Returns true only when a new referral row was created.
 */
export async function attachReferral(
  userId: string,
  code: string | undefined | null,
): Promise<boolean> {
  const candidate = (code ?? "").trim().toUpperCase();
  if (!candidate || !isPlausibleReferralCode(candidate)) return false;

  try {
    const db = createAdminClient();
    const { data, error } = await db.rpc("attach_referral", {
      p_referred_id: userId,
      p_code: candidate,
    });
    if (error) return false;
    return data === true;
  } catch {
    // Attribution is never worth failing a signup over.
    return false;
  }
}

export interface ReferralSummary {
  code: string;
  signedUp: number;
  qualified: number;
  creditsEarned: number;
  referrals: {
    id: string;
    createdAt: string;
    qualifiedAt: string | null;
    credits: number;
  }[];
}

/**
 * The referrer's own view. Deliberately returns no identifying detail about
 * the people referred — not an email, not a name. Someone's identity is not
 * the referrer's to see just because they clicked a link.
 */
export async function getReferralSummary(
  userId: string,
): Promise<ReferralSummary> {
  const code = await getOrCreateReferralCode(userId);
  const supabase = await createClient();

  const [{ data: referrals }, { data: rewards }] = await Promise.all([
    supabase
      .from("referrals")
      .select("id, created_at, qualified_at")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("referral_rewards")
      .select("referral_id, credits")
      .eq("user_id", userId),
  ]);

  const creditsByReferral = new Map<string, number>();
  for (const reward of rewards ?? []) {
    creditsByReferral.set(
      reward.referral_id,
      (creditsByReferral.get(reward.referral_id) ?? 0) + reward.credits,
    );
  }

  const rows = (referrals ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    qualifiedAt: row.qualified_at,
    credits: creditsByReferral.get(row.id) ?? 0,
  }));

  return {
    code,
    signedUp: rows.length,
    qualified: rows.filter((r) => r.qualifiedAt !== null).length,
    creditsEarned: (rewards ?? []).reduce((sum, r) => sum + r.credits, 0),
    referrals: rows,
  };
}

/** Absolute share link for a code. */
export function referralLink(code: string, baseUrl: string): string {
  return `${baseUrl}/?ref=${encodeURIComponent(code)}`;
}
