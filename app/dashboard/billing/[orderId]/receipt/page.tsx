import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { PrintButton } from "@/components/billing/print-button";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { requireUser } from "@/lib/auth/guards";
import { paymentProviderLabel } from "@/lib/payments/labels";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";

export const metadata = buildMetadata({ title: "Receipt", noIndex: true });
export const dynamic = "force-dynamic";

/**
 * A printable receipt, rendered on the server from the order row.
 *
 * Deliberately not a PDF and deliberately not a third-party invoicing
 * service: the browser's own "Print → Save as PDF" produces the file, and
 * bringing in an invoicing vendor is an external-dependency decision that
 * needs real credentials and a conversation, not a silent addition.
 *
 * RLS is what scopes this — the select runs on the caller's session client
 * and the `user_id` filter is defence in depth. Another user's order id
 * returns nothing and 404s.
 */
export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const user = await requireUser(`/dashboard/billing/${orderId}/receipt`);
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, plan_name, amount, currency, credits, status, payment_provider, provider_payment_id, pay_currency, pay_amount, completed_at, created_at",
    )
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!order) notFound();

  // Only a completed order has actually been paid for; anything else would be
  // a receipt for money that never moved.
  if (order.status !== "completed") {
    return (
      <div className="mx-auto max-w-2xl">
        <BackLink />
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <h1 className="text-[15px] font-semibold">No receipt for this order</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            A receipt is issued once payment completes. This order is currently{" "}
            {order.status}.
          </p>
          <Button asChild className="mt-6" size="sm" variant="outline">
            <Link href="/dashboard/billing">Back to billing</Link>
          </Button>
        </div>
      </div>
    );
  }

  const paidAt = order.completed_at ?? order.created_at;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="print:hidden">
        <BackLink />
        <div className="mb-5 flex justify-end">
          <PrintButton />
        </div>
      </div>

      <article className="rounded-xl border border-border bg-card p-8 print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <Logo />
            <p className="mt-2 text-[13px] text-muted-foreground">
              {siteConfig.url.replace(/^https?:\/\//, "")}
            </p>
          </div>
          <div className="text-right">
            <h1 className="text-lg font-semibold tracking-tight">Receipt</h1>
            <p className="mt-1 font-mono text-[12px] text-muted-foreground">
              {order.id}
            </p>
          </div>
        </header>

        <dl className="grid gap-x-8 gap-y-4 border-b border-border py-6 sm:grid-cols-2">
          <Field label="Billed to" value={user.email} />
          <Field label="Date paid" value={formatDateTime(paidAt)} />
          <Field
            label="Payment method"
            value={paymentProviderLabel(order.payment_provider)}
          />
          <Field
            label="Payment reference"
            value={order.provider_payment_id ?? "—"}
            mono
          />
        </dl>

        <table className="w-full border-b border-border py-6 text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-3 text-left font-medium text-muted-foreground">
                Description
              </th>
              <th className="py-3 text-right font-medium text-muted-foreground">
                Credits
              </th>
              <th className="py-3 text-right font-medium text-muted-foreground">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-4">
                <p className="font-medium">{order.plan_name}</p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  Prepaid Oply credits — one-time purchase, no subscription.
                </p>
              </td>
              <td className="py-4 text-right tabular-nums">
                {formatNumber(order.credits)}
              </td>
              <td className="py-4 text-right tabular-nums">
                {formatCurrency(Number(order.amount), order.currency)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t border-border">
              <td className="py-4 font-medium" colSpan={2}>
                Total paid
              </td>
              <td className="py-4 text-right text-base font-semibold tabular-nums">
                {formatCurrency(Number(order.amount), order.currency)}
              </td>
            </tr>
          </tfoot>
        </table>

        {order.pay_amount !== null && order.pay_currency && (
          <p className="mt-4 text-[13px] text-muted-foreground">
            Settled on-chain as {order.pay_amount} {order.pay_currency.toUpperCase()}.
          </p>
        )}

        <footer className="mt-6 space-y-2 text-[12px] leading-relaxed text-muted-foreground">
          <p>
            Credits were added to the account above as soon as this payment
            confirmed. Questions about this receipt: {siteConfig.supportEmail}.
          </p>
          <p>
            Oply does not currently collect or remit VAT/sales tax directly;
            where a payment was processed by Paddle as Merchant of Record, any
            tax invoice is issued by Paddle and sent to the email on the
            payment.
          </p>
        </footer>
      </article>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/billing"
      className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back to billing
    </Link>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className={`mt-1 text-sm ${mono ? "break-all font-mono text-[12px]" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
