import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Coins } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/empty-state";
import { Reveal } from "@/components/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { requireUser } from "@/lib/auth/guards";
import {
  getCreditSummary,
  getMonthlyUsage,
  getRecentTransactions,
} from "@/lib/credits";
import { cn, formatDateTime, formatNumber } from "@/lib/utils";
import type { CreditTransactionType } from "@/lib/types/database";

const TYPE_LABELS: Record<CreditTransactionType, string> = {
  purchase: "Purchase",
  usage: "Usage",
  refund: "Refund",
  bonus: "Bonus",
  admin_adjustment: "Adjustment",
};

export default async function CreditsPage() {
  const user = await requireUser("/dashboard/credits");

  const [credits, monthlyUsage, transactions] = await Promise.all([
    getCreditSummary(user.id),
    getMonthlyUsage(user.id),
    getRecentTransactions(user.id, 40),
  ]);

  const low = credits.balance <= siteConfig.lowCreditThreshold;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Credits"
        description="Credits are shared across all Oply tools."
        action={
          <Button asChild>
            <Link href="/pricing">Buy Credits</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Current balance"
          value={credits.balance}
          icon={Coins}
          size="lg"
          emphasis={low ? "warning" : "default"}
          footer={
            low ? (
              <p className="text-xs text-warning">
                You&apos;re running low on credits.
              </p>
            ) : undefined
          }
        />

        <StatCard
          label="Used this month"
          value={monthlyUsage}
          icon={ArrowDownRight}
          size="lg"
        />

        <StatCard
          label="Purchased all time"
          value={credits.lifetimePurchased}
          icon={ArrowUpRight}
          size="lg"
        />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-[15px] font-semibold">Recent transactions</h2>

        {transactions.length === 0 ? (
          <EmptyState
            icon={Coins}
            title="No transactions yet."
            description="Every credit purchase, use and refund is recorded here."
          />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {transactions.map((tx, i) => {
              const positive = tx.amount > 0;
              return (
                <Reveal
                  as="li"
                  key={tx.id}
                  /* Capped so a 40-row list does not end on a two-second
                     wait for the last item. */
                  delay={Math.min(i, 8) * 0.04}
                  className="flex items-center gap-3 px-5 py-3.5"
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      positive
                        ? "bg-success/12 text-success"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {positive ? (
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13.5px] font-medium">
                        {tx.description ?? TYPE_LABELS[tx.type]}
                      </p>
                      <Badge variant="outline">{TYPE_LABELS[tx.type]}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDateTime(tx.created_at)}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        "text-sm font-medium tabular-nums",
                        positive ? "text-success" : "text-foreground",
                      )}
                    >
                      {positive ? "+" : ""}
                      {formatNumber(tx.amount)}
                    </p>
                    <p className="text-[11px] tabular-nums text-muted-foreground">
                      {formatNumber(tx.balance_after)} after
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        )}
      </section>

      <p className="mt-6 text-[13px] leading-relaxed text-muted-foreground">
        Credits never expire. If a generation fails after credits are reserved,
        they are refunded automatically and appear above as a refund entry.
      </p>
    </div>
  );
}
