import { ToolUsageChart } from "@/components/admin/charts";
import { StatCard } from "@/components/admin/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getToolUsage } from "@/lib/admin/stats";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminUsagePage() {
  const db = createAdminClient();

  const [toolUsage, { data: recent }] = await Promise.all([
    getToolUsage(),
    db
      .from("ai_usage")
      .select(
        "id, tool_slug, provider, model, input_tokens, output_tokens, estimated_cost_usd, credits_charged, success, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const totals = toolUsage.reduce(
    (acc, row) => ({
      generations: acc.generations + row.generations,
      credits: acc.credits + row.creditsConsumed,
      cost: acc.cost + row.estimatedCost,
    }),
    { generations: 0, credits: 0, cost: 0 },
  );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-[1.5rem] font-semibold tracking-[-0.022em]">Usage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Token counts come from the AI provider. The dollar figures are our own
          arithmetic against the price table in <code>lib/ai/models.ts</code>, so
          they are estimates.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total generations" value={formatNumber(totals.generations)} />
        <StatCard label="Credits consumed" value={formatNumber(totals.credits)} />
        <StatCard
          label="Estimated AI cost"
          value={formatCurrency(totals.cost)}
          hint="Estimated, not billed"
        />
      </div>

      {toolUsage.length > 0 && (
        <>
          <div className="mt-6">
            <ToolUsageChart data={toolUsage} />
          </div>

          <h2 className="mb-3 mt-8 text-[15px] font-semibold">By tool</h2>
          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead>Generations</TableHead>
                  <TableHead>Credits consumed</TableHead>
                  <TableHead>Estimated cost</TableHead>
                  <TableHead>Est. cost per run</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {toolUsage.map((row) => (
                  <TableRow key={row.slug}>
                    <TableCell className="font-mono text-xs">{row.slug}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatNumber(row.generations)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatNumber(row.creditsConsumed)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatCurrency(row.estimatedCost)}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {formatCurrency(
                        row.generations ? row.estimatedCost / row.generations : 0,
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <h2 className="mb-3 mt-8 text-[15px] font-semibold">Recent requests</h2>
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Tool</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>In</TableHead>
              <TableHead>Out</TableHead>
              <TableHead>Est. cost</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(recent ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatDateTime(row.created_at)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {row.tool_slug ?? "—"}
                </TableCell>
                <TableCell className="text-xs">{row.model}</TableCell>
                <TableCell className="tabular-nums text-xs">
                  {row.input_tokens ?? "—"}
                </TableCell>
                <TableCell className="tabular-nums text-xs">
                  {row.output_tokens ?? "—"}
                </TableCell>
                <TableCell className="tabular-nums text-xs">
                  {row.estimated_cost_usd
                    ? `$${Number(row.estimated_cost_usd).toFixed(4)}`
                    : "—"}
                </TableCell>
                <TableCell className="tabular-nums text-xs">
                  {row.credits_charged ?? 0}
                </TableCell>
                <TableCell className="text-xs">
                  {row.success ? (
                    <span className="text-success">ok</span>
                  ) : (
                    <span className="text-destructive">failed</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {(recent ?? []).length === 0 && (
          <p className="py-14 text-center text-sm text-muted-foreground">
            No AI requests recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}
