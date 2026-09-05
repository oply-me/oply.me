import { notFound } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { CheckoutStatus } from "@/components/billing/checkout-status";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { isDevPaymentModeEnabled } from "@/lib/payments";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({ title: "Checkout", noIndex: true });
export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  await requireUser(`/checkout/${orderId}`);

  // RLS restricts this to the signed-in user's own orders.
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, plan_name, amount, currency, credits, status, provider_checkout_url, pay_address, pay_amount, pay_currency, expires_at, created_at",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) notFound();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Link href="/" aria-label="Oply home">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <main id="main" className="flex flex-1 justify-center px-6 py-10">
        <div className="w-full max-w-lg">
          <CheckoutStatus order={order} devMode={isDevPaymentModeEnabled()} />
        </div>
      </main>
    </div>
  );
}
