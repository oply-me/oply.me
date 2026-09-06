import Link from "next/link";
import { CheckCircle2, Coins, CreditCard, ReceiptText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/empty-state";
import { Reveal } from "@/components/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  tableRowClass,
} from "@/components/ui/table";
import { paymentProviderLabel } from "@/lib/payments/labels";
import { requireUser } from "@/lib/auth/guards";
import { getCreditSummary } from "@/lib/credits";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types/database";

const STATUS_VARIANT: Record<
  OrderStatus,
  "default" | "success" | "warning" | "destructive" | "outline"
> = {
  pending: "warning",
  processing: "warning",
  completed: "success",
  failed: "destructive",
  expired: "outline",
  refunded: "outline",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Waiting for payment",
  processing: "Confirming",
  completed: "Completed",
  failed: "Failed",
  expired: "Expired",
  refunded: "Refunded",
};

export default async function BillingPage() {
  const user = await requireUser("/dashboard/billing");
  const supabase = await createClient();

  const [credits, { data: orders }] = await Promise.all([
    getCreditSummary(user.id),
    supabase
      .from("orders")
      .select(
        "id, plan_name, amount, currency, credits, status, payment_provider, provider_payment_id, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Billing"
        description="Your orders and payment history. Oply is one-time payments only — there is no subscription."
        action={
          <Button asChild>
            <Link href="/pricing">Buy Credits</Link>
          </Button>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Plan"
          value="Pay as you go"
          icon={CreditCard}
          size="sm"
          footer={
            <p className="text-xs text-muted-foreground">No recurring charge</p>
          }
        />
        <StatCard
          label="Credit balance"
          value={credits.balance}
          icon={Coins}
          size="sm"
        />
        <StatCard
          label="Completed orders"
          value={(orders ?? []).filter((o) => o.status === "completed").length}
          icon={CheckCircle2}
          size="sm"
        />
      </div>

      <h2 className="mb-4 text-[15px] font-semibold">Order history</h2>

      {(orders ?? []).length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No orders yet."
          description="When you buy a credit pack, the order and its payment status appear here."
          action={{ label: "See pricing", href: "/pricing" }}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(orders ?? []).map((order, i) => (
                <Reveal
                  as="tr"
                  key={order.id}
                  delay={Math.min(i, 8) * 0.04}
                  className={tableRowClass}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {order.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="font-medium">{order.plan_name}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatCurrency(Number(order.amount), order.currency)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatNumber(order.credits)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {paymentProviderLabel(order.payment_provider)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[order.status]}>
                      {STATUS_LABEL[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(order.created_at)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {order.status === "pending" || order.status === "processing" ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/checkout/${order.id}`}>View</Link>
                      </Button>
                    ) : order.status === "completed" ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/billing/${order.id}/receipt`}>
                          <ReceiptText />
                          Receipt
                        </Link>
                      </Button>
                    ) : null}
                  </TableCell>
                </Reveal>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="mt-6 text-[13px] leading-relaxed text-muted-foreground">
        Quote the order ID when contacting support about a payment. Refund terms
        are set out in the{" "}
        <Link href="/refund-policy" className="text-primary hover:underline">
          Refund Policy
        </Link>
        .
      </p>
    </div>
  );
}
