import Link from "next/link";
import { CheckCircle2, Coins, Gift, UserPlus } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/empty-state";
import { Reveal } from "@/components/reveal";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { requireUser } from "@/lib/auth/guards";
import {
  getReferralSettings,
  getReferralSummary,
  referralLink,
} from "@/lib/referrals";
import { formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const user = await requireUser("/dashboard/referrals");
  const [summary, settings] = await Promise.all([
    getReferralSummary(user.id),
    getReferralSettings(),
  ]);

  const link = referralLink(summary.code, siteConfig.url);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Refer and earn"
        description={
          settings.rewardCredits > 0
            ? `Share your link. When someone you refer buys their first credit pack, you get ${formatNumber(settings.rewardCredits)} credits.`
            : "Share your link. Rewards are paid when someone you refer buys their first credit pack."
        }
      />

      {(!settings.enabled || settings.rewardCredits === 0) && (
        <p className="mb-6 rounded-lg border border-warning/40 bg-warning/5 p-4 text-[13px] leading-relaxed text-muted-foreground">
          The referral program is paused. Existing referrals are unaffected, but
          new signups from your link will not be attributed while it is off.
        </p>
      )}

      {/* Link */}
      <div className="mb-8 rounded-xl border border-border bg-card p-5">
        <p className="text-[13px] font-medium">Your referral link</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg bg-muted/50 px-3 py-2.5 font-mono text-[13px]">
            {link}
          </code>
          <CopyButton value={link} successMessage="Referral link copied" />
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
          Your code is <span className="font-mono font-medium">{summary.code}</span>.
          Credits arrive once the person you referred completes their first
          purchase — not at signup. If that purchase is later refunded or
          charged back, the reward is reversed.
        </p>
      </div>

      {/* Counters */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Signed up" value={summary.signedUp} icon={UserPlus} />
        <StatCard
          label="Made a purchase"
          value={summary.qualified}
          icon={CheckCircle2}
        />
        <StatCard
          label="Credits earned"
          value={summary.creditsEarned}
          icon={Coins}
          footer={
            <Link
              href="/dashboard/credits"
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              See credit history
            </Link>
          }
        />
      </div>

      <h2 className="mb-4 text-[15px] font-semibold">Your referrals</h2>

      {summary.referrals.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No referrals yet."
          description="Share your link with someone who would actually use these tools. You will see them here as soon as they create an account."
          illustration="/illustrations/empty-referrals.webp"
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {summary.referrals.map((referral, i) => (
            <Reveal
              as="li"
              key={referral.id}
              delay={Math.min(i, 8) * 0.04}
              className="flex flex-wrap items-center gap-3 px-5 py-3.5"
            >
              <div className="min-w-0 flex-1">
                {/*
                 * Deliberately anonymous. Someone's name or email is not the
                 * referrer's to see just because they followed a link.
                 */}
                <p className="text-[13.5px] font-medium">
                  Referred account
                  <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                    #{referral.id.slice(0, 6)}
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Joined {formatDate(referral.createdAt)}
                  {referral.qualifiedAt
                    ? ` · purchased ${formatDate(referral.qualifiedAt)}`
                    : ""}
                </p>
              </div>

              {referral.qualifiedAt ? (
                <Badge variant="success">Earned</Badge>
              ) : (
                <Badge variant="outline">Awaiting first purchase</Badge>
              )}

              <span className="w-20 shrink-0 text-right text-sm font-medium tabular-nums">
                {referral.credits > 0 ? `+${formatNumber(referral.credits)}` : "—"}
              </span>
            </Reveal>
          ))}
        </ul>
      )}

      <p className="mt-6 text-[13px] leading-relaxed text-muted-foreground">
        Referral credits work exactly like purchased credits and never expire.
        They have no cash value and cannot be withdrawn or transferred. Full
        terms are in the{" "}
        <Link href="/referrals" className="text-primary hover:underline">
          program details
        </Link>
        .
      </p>
    </div>
  );
}
