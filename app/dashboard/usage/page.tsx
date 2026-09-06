import Link from "next/link";
import { BarChart3, Coins, RotateCcw, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  CreditsByToolChart,
  CreditsOverTimeChart,
} from "@/components/dashboard/usage-charts";
import { EmptyState } from "@/components/empty-state";
import { Reveal } from "@/components/reveal";
import { ToolTile } from "@/components/tools/tool-tile";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { getUsageSummary, parseRange } from "@/lib/dashboard/usage";
import { listTools } from "@/lib/tools/registry";
import { cn, formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function UsagePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = parseRange(params.range);
  const user = await requireUser("/dashboard/usage");

  const [usage, tools] = await Promise.all([
    getUsageSummary(user.id, range),
    listTools(),
  ]);

  const categoryBySlug = new Map(tools.map((t) => [t.slug, t.category]));
  const iconBySlug = new Map(tools.map((t) => [t.slug, t.icon]));

  // A generation row keeps the slug of a tool that may since have been
  // disabled; those still count, they just have no category hue to borrow.
  const byTool = usage.byTool.map((slice) => ({
    ...slice,
    category: categoryBySlug.get(slice.slug) ?? "",
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Usage"
        description={`Credits you have spent over the last ${range} days, from your own generation history.`}
        action={
          <div className="flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1 text-[13px] font-medium">
            {[30, 90].map((days) => (
              <Link
                key={days}
                href={`/dashboard/usage?range=${days}`}
                aria-current={range === days ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-1.5 transition-colors",
                  range === days
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {days} days
              </Link>
            ))}
          </div>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Credits spent" value={usage.totalCredits} icon={Coins} />
        <StatCard
          label="Generations"
          value={usage.totalGenerations}
          icon={Sparkles}
        />
        <StatCard
          label="Credits refunded"
          value={usage.refundedCredits}
          icon={RotateCcw}
          footer={
            <p className="text-xs text-muted-foreground">
              Returned automatically for failed runs
            </p>
          }
        />
        <StatCard label="Busiest day" icon={BarChart3}>
          {usage.busiestDay ? (
            <>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatNumber(usage.busiestDay.credits)}
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                {formatDate(`${usage.busiestDay.date}T00:00:00Z`)}
              </p>
            </>
          ) : (
            <p className="mt-3 text-[13px] text-muted-foreground">
              No usage in this period.
            </p>
          )}
        </StatCard>
      </div>

      {usage.totalGenerations === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No usage in this period."
          description="Run any Oply tool and your credit spend will be charted here, day by day and tool by tool."
          action={{ label: "Browse tools", href: "/dashboard/tools" }}
        />
      ) : (
        <div className="space-y-6">
          <Reveal>
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-[15px] font-semibold">Credits per day</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Every generation you ran, bucketed by the day it ran (UTC).
              </p>
              <div className="mt-5">
                <CreditsOverTimeChart data={usage.series} />
              </div>
            </section>
          </Reveal>

          <Reveal delay={0.08}>
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-[15px] font-semibold">Credits by tool</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Which tools consumed the most credits in this period.
              </p>
              <div className="mt-5">
                <CreditsByToolChart data={byTool} />
              </div>

              <ul className="mt-5 divide-y divide-border border-t border-border">
                {byTool.map((slice) => (
                  <li
                    key={slice.slug}
                    className="flex items-center gap-3 py-3 text-[13px]"
                  >
                    <ToolTile
                      icon={iconBySlug.get(slice.slug) ?? "Sparkles"}
                      category={slice.category}
                      className="h-8 w-8"
                    />
                    <Link
                      href={`/dashboard/history?tool=${slice.slug}`}
                      className="min-w-0 flex-1 truncate font-medium hover:text-primary"
                    >
                      {slice.name}
                    </Link>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatNumber(slice.generations)}{" "}
                      {slice.generations === 1 ? "run" : "runs"}
                    </span>
                    <span className="w-20 shrink-0 text-right font-medium tabular-nums">
                      {formatNumber(slice.credits)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>

          {usage.failedGenerations > 0 && (
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              {formatNumber(usage.failedGenerations)} of these runs failed. The
              credits they reserved were returned to your balance automatically
              and appear in your{" "}
              <Link href="/dashboard/credits" className="text-primary hover:underline">
                credit history
              </Link>
              .
            </p>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/activity">View full activity</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/credits">Credit history</Link>
        </Button>
      </div>
    </div>
  );
}
