import { Suspense } from "react";
import { cookies } from "next/headers";
import { AuthForm } from "@/components/auth/auth-form";
import { REFERRAL_COOKIE } from "@/lib/referrals";
import { Skeleton } from "@/components/ui/skeleton";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Create your account",
  path: "/signup",
  noIndex: true,
});

export default async function SignupPage() {
  /*
   * Read here rather than in the browser: the cookie is httpOnly, and passing
   * the code through signup metadata is what lets attribution survive the user
   * confirming their email in a different browser, where the cookie is absent.
   * The value is still only ever a lookup key — `attach_referral` resolves it
   * against `referral_codes` and rejects anything it does not recognise.
   */
  const referralCode = (await cookies()).get(REFERRAL_COOKIE)?.value ?? null;

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <AuthForm mode="signup" referralCode={referralCode} />
    </Suspense>
  );
}
