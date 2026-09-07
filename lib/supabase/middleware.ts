import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** Referral link capture. Kept in sync with lib/referrals.ts. */
const REFERRAL_COOKIE = "oply_ref";
const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const REFERRAL_CODE_PATTERN = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/;

/** Route prefixes that require a signed-in user. */
const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/checkout"];
/** Auth pages a signed-in user should not sit on. */
const AUTH_ROUTES = ["/login", "/signup"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes the auth token as a side effect — must not be removed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  /*
   * `?ref=CODE` on any public page is remembered so the code survives the walk
   * from a landing page to /signup, and the round trip through an emailed
   * confirmation link. Only the shape is checked here — the code is resolved
   * against `referral_codes` server-side by `attach_referral`, which is where
   * self-referral and unknown codes are rejected. First touch wins: an
   * existing cookie is not overwritten, matching `unique (referred_id)`.
   */
  const ref = request.nextUrl.searchParams.get("ref");
  const captureRef =
    ref !== null &&
    !user &&
    !request.cookies.has(REFERRAL_COOKIE) &&
    REFERRAL_CODE_PATTERN.test(ref.trim().toUpperCase());

  if (!user && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && AUTH_ROUTES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (captureRef) {
    response.cookies.set(REFERRAL_COOKIE, ref!.trim().toUpperCase(), {
      maxAge: REFERRAL_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  return response;
}
