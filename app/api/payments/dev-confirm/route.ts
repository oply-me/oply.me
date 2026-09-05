import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/guards";
import { DevPaymentProvider, isDevPaymentModeEnabled } from "@/lib/payments/providers/dev";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Development-only: signs a fake provider payload and posts it to the real
 * webhook, so the full verify → idempotency → credit path can be exercised
 * without provider credentials.
 *
 * Returns 404 outside development so the route does not exist in production.
 * It cannot short-circuit crediting: the webhook still verifies the signature
 * and still goes through the same RPC.
 */
export async function POST(request: Request) {
  if (!isDevPaymentModeEnabled()) {
    return new NextResponse(null, { status: 404 });
  }

  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const { orderId } = (await request.json()) as { orderId?: string };
  if (!orderId) {
    return NextResponse.json({ error: "Missing order id." }, { status: 400 });
  }

  // RLS confines this to the caller's own orders.
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, amount, currency, provider_payment_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const payload = JSON.stringify({
    payment_id: order.provider_payment_id ?? `dev_${order.id}`,
    payment_status: "finished",
    order_id: order.id,
    price_amount: Number(order.amount),
    price_currency: order.currency,
  });

  const signature = new DevPaymentProvider().sign(payload);

  const response = await fetch(`${siteConfig.url}/api/payments/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-dev-payment-sig": signature,
    },
    body: payload,
  });

  return NextResponse.json({ ok: response.ok, status: response.status });
}
