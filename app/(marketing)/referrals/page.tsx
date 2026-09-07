import Link from "next/link";
import { CheckCircle2, Coins, Share2, UserPlus } from "lucide-react";
import { FooterCta } from "@/components/marketing/cta";
import { Section, SectionHeading } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { getSessionUser } from "@/lib/auth/guards";
import { getReferralSettings } from "@/lib/referrals";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatNumber } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Refer a friend",
  description:
    "Share Oply and earn credits when someone you refer buys their first credit pack. Credits only — no cash payouts, no tiers.",
  path: "/referrals",
});

export const dynamic = "force-dynamic";

export default async function ReferralsProgramPage() {
  // Read from the same row that pays the reward, so the number on this page
  // cannot drift into a promise that is not honoured.
  const [settings, user] = await Promise.all([
    getReferralSettings(),
    getSessionUser(),
  ]);

  /*
   * A rate of zero means the program is not configured — the settings row is
   * missing, or an admin has zeroed it. Advertising "earn 0 credits" would be
   * a broken promise dressed as a number, so the page says what is true
   * instead.
   */
  const live = settings.enabled && settings.rewardCredits > 0;

  const steps = [
    {
      icon: Share2,
      title: "Share your link",
      body: "Every account has a referral link in the dashboard. Anyone who follows it is attributed to you when they sign up.",
    },
    {
      icon: UserPlus,
      title: "They create an account",
      body: `New accounts start with ${formatNumber(siteConfig.signupBonusCredits)} welcome credits, so they can try the tools before paying anything.`,
    },
    {
      icon: Coins,
      title: "You earn on their first purchase",
      body: live
        ? `When they buy their first credit pack, ${formatNumber(settings.rewardCredits)} credits are added to your balance automatically.`
        : "When they buy their first credit pack, the published reward is added to your balance automatically.",
    },
  ];

  return (
    <>
      <Section className="border-b border-border bg-surface">
        <div className="container max-w-3xl text-center">
          <SectionHeading
            eyebrow="Referrals"
            title="Share Oply, earn credits"
            description={
              live
                ? `Earn ${formatNumber(settings.rewardCredits)} credits every time someone you refer buys their first credit pack. No tiers, no targets, no cash payouts.`
                : "The referral program is not running at the moment. This page explains how it works when it is."
            }
          />
          {live && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href={user ? "/dashboard/referrals" : "/signup"}>
                  {user ? "Get your link" : "Create an account"}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          )}
        </div>
      </Section>

      <Section>
        <div className="container">
          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="border-t border-border bg-surface">
        <div className="container max-w-3xl">
          <SectionHeading align="left" title="The rules, in full" />
          <ul className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
            <Rule>
              The reward is paid in Oply credits, not money. Credits work in
              every tool and never expire, but they have no cash value and
              cannot be withdrawn, transferred or exchanged.
            </Rule>
            <Rule>
              You earn once per referred account, on their first completed
              purchase — not at signup, and not again on later purchases.
            </Rule>
            <Rule>
              A person can only be referred once, by whoever&apos;s link they
              followed first. Attribution does not change later.
            </Rule>
            <Rule>
              You cannot refer yourself. Signups that resolve to your own
              account or your own email address are not attributed.
            </Rule>
            <Rule>
              If the qualifying purchase is refunded or charged back, the
              referral reward is reversed. If those credits have already been
              spent, the balance is reduced to zero rather than going negative.
            </Rule>
            <Rule>
              We may void referrals and withhold rewards where a referral is
              not genuine. Details are in the{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>
              .
            </Rule>
          </ul>
        </div>
      </Section>

      <FooterCta />
    </>
  );
}

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <CheckCircle2
        className="mt-1 h-4 w-4 shrink-0 text-success"
        aria-hidden="true"
      />
      <span>{children}</span>
    </li>
  );
}
