import Link from "next/link";
import { StatCard } from "@/components/admin/stat-card";
import { TrendChart, ToolUsageChart } from "@/components/admin/charts";
import { Button } from "@/components/ui/button";
import { getAdminOverview, getTimeSeries, getToolUsage } from "@/lib/admin/stats";
import { formatCurrency, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [overview, series, toolUsage] = await Promise.all([
    getAdminOverview(),
    getTimeSeries(30),
    getToolUsage(),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.5rem] font-semibold tracking-[-0.022em]">
            Overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live figures from the database. Nothing here is sampled or estimated
            except where labelled.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/orders">View orders</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total users"
          value={formatNumber(overview.totalUsers)}
          hint={`${formatNumber(overview.newUsers7d)} new in 7 days`}
        />
        <StatCard
          label="Revenue"
          value={formatCurrency(overview.totalRevenue)}
          hint={`${overview.completedOrders} completed orders`}
        />
        <StatCard
          label="Credits sold"
          value={formatNumber(overview.creditsSold)}
          hint={`${formatNumber(overview.creditsConsumed)} consumed`}
        />
        <StatCard
          label="Generations"
          value={formatNumber(overview.generations)}
          hint={`${formatNumber(overview.generations7d)} in 7 days`}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Estimated AI cost"
          value={formatCurrency(overview.estimatedAiCost)}
          hint="From provider token counts × our price table"
        />
        <StatCard
          label="Estimated payment fees"
          value={formatCurrency(overview.estimatedPaymentFees)}
          hint="Assumed rate — not a billed figure"
        />
        <StatCard
          label="Estimated gross margin"
          value={formatCurrency(overview.estimatedGrossMargin)}
          hint="Revenue − AI cost − assumed fees"
        />
        <StatCard
          label="Pending orders"
          value={formatNumber(overview.pendingOrders)}
          hint="Awaiting payment or confirmation"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <TrendChart data={series} dataKey="users" label="New users" />
        <TrendChart data={series} dataKey="revenue" label="Revenue" prefix="$" />
        <TrendChart data={series} dataKey="generations" label="Generations" />
      </div>

      <div className="mt-6">
        {toolUsage.length > 0 ? (
          <ToolUsageChart data={toolUsage} />
        ) : (
          <div className="rounded-xl border border-dashed border-border py-14 text-center">
            <p className="text-[15px] font-medium">No usage recorded yet.</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Charts populate once tools start running.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
