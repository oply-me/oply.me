import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types/database";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUSES: (OrderStatus | "all")[] = [
  "all",
  "completed",
  "pending",
  "processing",
  "failed",
  "expired",
  "refunded",
];

const VARIANT: Record<OrderStatus, "success" | "warning" | "destructive" | "outline"> = {
  completed: "success",
  pending: "warning",
  processing: "warning",
  failed: "destructive",
  expired: "outline",
  refunded: "outline",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const db = createAdminClient();

  let query = db
    .from("orders")
    .select(
      "id, user_id, plan_name, amount, currency, credits, status, payment_provider, provider_payment_id, created_at, profiles(email)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status && status !== "all") {
    query = query.eq("status", status as OrderStatus);
  }

  const { data: orders } = await query;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-[1.5rem] font-semibold tracking-[-0.022em]">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every order, with the payment reference returned by the provider.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((value) => {
          const active = (status ?? "all") === value;
          return (
            <Link
              key={value}
              href={value === "all" ? "/admin/orders" : `/admin/orders?status=${value}`}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[13px] font-medium capitalize transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {value}
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Payment ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(orders ?? []).map((order) => {
              const profile = order.profiles as unknown as { email: string } | null;
              return (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {order.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-xs">{profile?.email ?? "—"}</TableCell>
                  <TableCell className="font-medium">{order.plan_name}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatCurrency(Number(order.amount), order.currency)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatNumber(order.credits)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {order.payment_provider}
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate font-mono text-xs text-muted-foreground">
                    {order.provider_payment_id ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={VARIANT[order.status]} className="capitalize">
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateTime(order.created_at)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {(orders ?? []).length === 0 && (
          <p className="py-14 text-center text-sm text-muted-foreground">
            No orders match this filter.
          </p>
        )}
      </div>
    </div>
  );
}
