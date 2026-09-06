"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { categoryColors } from "@/config/categories";
import type { ToolUsageSlice, UsagePoint } from "@/lib/dashboard/usage";

/**
 * The user-facing usage charts. Deliberately the same recharts idiom as
 * `components/admin/charts.tsx` — same axis props, same tooltip surface, same
 * theme tokens — so the two never drift into looking like different products.
 */

const axisProps = {
  stroke: "hsl(var(--muted-foreground))",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

function tooltipStyle() {
  return {
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
    color: "hsl(var(--popover-foreground))",
  };
}

function shortDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function CreditsOverTimeChart({ data }: { data: UsagePoint[] }) {
  return (
    <div className="h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="fill-credits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            minTickGap={24}
            {...axisProps}
          />
          <YAxis {...axisProps} width={44} allowDecimals={false} />
          <Tooltip
            contentStyle={tooltipStyle()}
            labelFormatter={shortDate}
            formatter={(value: number, key) => [
              value,
              key === "credits" ? "Credits" : "Generations",
            ]}
          />
          <Area
            type="monotone"
            dataKey="credits"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#fill-credits)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Bars are tinted with each tool's own category hue, the same
 * `categoryColors()` system the tool grid uses, so a colour means the same
 * thing on both sides of the sign-in wall.
 */
export function CreditsByToolChart({
  data,
}: {
  data: (ToolUsageSlice & { category: string })[];
}) {
  const rows = data.slice(0, 8);

  return (
    <div style={{ height: Math.max(160, rows.length * 38 + 40) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            horizontal={false}
          />
          <XAxis type="number" allowDecimals={false} {...axisProps} />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            {...axisProps}
          />
          <Tooltip
            contentStyle={tooltipStyle()}
            cursor={{ fill: "hsl(var(--muted))" }}
            formatter={(value: number) => [value, "Credits"]}
          />
          <Bar dataKey="credits" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {rows.map((row) => (
              <Cell key={row.slug} fill={categoryColors(row.category).solid} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
