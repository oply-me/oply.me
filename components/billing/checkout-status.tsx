"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types/database";

interface Order {
  id: string;
  plan_name: string;
  amount: number;
  currency: string;
  credits: number;
  status: OrderStatus;
  provider_checkout_url: string | null;
  pay_address: string | null;
  pay_amount: number | null;
  pay_currency: string | null;
  expires_at: string | null;
  created_at: string;
}

const STATUS_COPY: Record<
  OrderStatus,
  { label: string; body: string; tone: "pending" | "success" | "error" }
> = {
  pending: {
    label: "Waiting for payment",
    body: "Complete the payment with your wallet. This page updates on its own.",
    tone: "pending",
  },
  processing: {
    label: "Confirming",
    body: "Payment detected. We're waiting for network confirmation — credits are added as soon as it clears.",
    tone: "pending",
  },
  completed: {
    label: "Payment completed",
    body: "Your credits have been added to your account.",
    tone: "success",
  },
  failed: {
    label: "Payment failed",
    body: "The payment did not go through. Nothing was charged to your account.",
    tone: "error",
  },
  expired: {
    label: "Payment expired",
    body: "This order timed out before payment arrived. Start a new one whenever you're ready.",
    tone: "error",
  },
  refunded: {
    label: "Refunded",
    body: "This order was refunded.",
    tone: "error",
  },
};

export function CheckoutStatus({
  order: initialOrder,
  devMode,
}: {
  order: Order;
  devMode: boolean;
}) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  const isFinal =
    order.status === "completed" ||
    order.status === "failed" ||
    order.status === "expired" ||
    order.status === "refunded";

  const poll = useCallback(async () => {
    try {
      const response = await fetch(`/api/payments/${order.id}`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.order && data.order.status !== order.status) {
        setOrder(data.order);
        if (data.order.status === "completed") {
          toast.success("Payment confirmed — credits added");
          router.refresh();
        }
      }
    } catch {
      // Transient network issues are ignored; the next tick tries again.
    }
  }, [order.id, order.status, router]);

  // Poll while the order is still in flight.
  useEffect(() => {
    if (isFinal) return;
    const timer = setInterval(poll, 6000);
    return () => clearInterval(timer);
  }, [isFinal, poll]);

  // Expiry countdown, only when the provider gave us one.
  useEffect(() => {
    if (!order.expires_at || isFinal) {
      setCountdown(null);
      return;
    }
    const target = new Date(order.expires_at).getTime();

    const tick = () => {
      const remaining = target - Date.now();
      if (remaining <= 0) {
        setCountdown(null);
        return;
      }
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${minutes}:${String(seconds).padStart(2, "0")}`);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [order.expires_at, isFinal]);

  async function simulatePayment() {
    setSimulating(true);
    try {
      await fetch("/api/payments/dev-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      await poll();
    } finally {
      setSimulating(false);
    }
  }

  const copy = STATUS_COPY[order.status];

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      {/* Status */}
      <div className="flex items-start gap-4">
        <StatusIcon tone={copy.tone} />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold">{copy.label}</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {copy.body}
          </p>
        </div>
        {countdown && (
          <Badge variant="outline" className="shrink-0 tabular-nums">
            <Clock className="h-3 w-3" />
            {countdown}
          </Badge>
        )}
      </div>

      {/* Order summary */}
      <dl className="mt-8 space-y-3 border-t border-border pt-6 text-sm">
        <Row label="Plan" value={order.plan_name} />
        <Row
          label="Amount"
          value={formatCurrency(Number(order.amount), order.currency)}
        />
        <Row
          label="Credits"
          value={`${formatNumber(order.credits)} credits`}
        />
        <div className="flex items-start justify-between gap-4">
          <dt className="text-muted-foreground">Order ID</dt>
          <dd className="flex items-center gap-1.5">
            <span className="font-mono text-xs">{order.id}</span>
            <CopyButton value={order.id} size="icon-sm" variant="ghost" />
          </dd>
        </div>
      </dl>

      {/* Stated at the point of purchase, not only on the policy page — the
          refund stance has to be visible where the money is actually spent. */}
      <p className="mt-6 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
        Credits are delivered as soon as payment confirms, and credit purchases
        are final. Duplicate charges and credits that never arrive are still
        refunded, and a failed generation always returns its credits
        automatically — see the{" "}
        <Link href="/refund-policy" className="text-primary hover:underline">
          Refund Policy
        </Link>
        . This does not affect the consumer rights that apply where you live.
      </p>

      {/* Payment details */}
      {!isFinal && (
        <div className="mt-6 space-y-4 border-t border-border pt-6">
          {order.provider_checkout_url ? (
            <Button asChild className="w-full" size="lg">
              <a
                href={order.provider_checkout_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open payment page
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          ) : order.pay_address ? (
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Send {order.pay_amount ?? ""}{" "}
                {order.pay_currency?.toUpperCase() ?? ""} to
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all font-mono text-xs">
                  {order.pay_address}
                </code>
                <CopyButton value={order.pay_address} size="icon-sm" variant="ghost" />
              </div>
            </div>
          ) : null}

          <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            Checking for payment…
          </p>

          {devMode && (
            <div className="rounded-lg border border-dashed border-warning/40 bg-warning/5 p-4">
              <p className="text-[13px] font-medium text-warning">
                Development payment mode
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                No real payment provider is configured. This button signs a
                simulated webhook and posts it to the real webhook endpoint, so
                signature verification, idempotency and credit allocation all
                run exactly as they would in production.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                loading={simulating}
                onClick={simulatePayment}
              >
                Simulate confirmed payment
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Final actions */}
      <div className="mt-6 flex flex-col gap-2 border-t border-border pt-6 sm:flex-row">
        {order.status === "completed" ? (
          <>
            <Button asChild className="flex-1">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/dashboard/credits">View credits</Link>
            </Button>
          </>
        ) : isFinal ? (
          <>
            <Button asChild className="flex-1">
              <Link href="/pricing">Try again</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/contact">Contact support</Link>
            </Button>
          </>
        ) : (
          <Button asChild variant="ghost" className="flex-1">
            <Link href="/dashboard/billing">View all orders</Link>
          </Button>
        )}
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        Credits are added only after the payment provider confirms the
        transaction to our server. Closing this page will not interrupt that.
      </p>
    </div>
  );
}

function StatusIcon({ tone }: { tone: "pending" | "success" | "error" }) {
  if (tone === "success") {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/12 text-success">
        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
      </span>
    );
  }
  if (tone === "error") {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/12 text-destructive">
        <XCircle className="h-5 w-5" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/12 text-warning">
      <AlertCircle className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
