import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/guards";
import { getPlan } from "@/config/pricing";
import { siteConfig } from "@/config/site";
import { getPaymentProvider, isPaymentConfigured } from "@/lib/payments";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/security/rate-limit";
import { createPaymentSchema } from "@/lib/security/validation";
import { trackServer } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to buy credits." },
      { status: 401 },
    );
  }

  const limit = await rateLimit("payment", user.id);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Try again shortly." },
      { status: 429 },
    );
  }

  if (!isPaymentConfigured()) {
    return NextResponse.json(
      { error: "Checkout is not available right now." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = createPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  // The client sends a plan id and nothing else. Price and credit quantity are
  // read from server configuration — never from the request body.
  const plan = getPlan(parsed.data.planId);
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const db = createAdminClient();
  const provider = getPaymentProvider();

  const { data: order, error: orderError } = await db
    .from("orders")
    .insert({
      user_id: user.id,
      plan_id: plan.id,
      plan_name: plan.name,
      amount: plan.price,
      currency: plan.currency,
      credits: plan.credits,
      status: "pending",
      payment_provider: provider.name,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("[payments/create] could not create order", {
      userId: user.id,
      planId: plan.id,
      error: orderError?.message,
    });
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 },
    );
  }

  try {
    const payment = await provider.createPayment({
      orderId: order.id,
      amount: plan.price,
      currency: plan.currency,
      description: `${siteConfig.name} — ${plan.name} (${plan.credits} credits)`,
      successUrl: `${siteConfig.url}/checkout/${order.id}`,
      cancelUrl: `${siteConfig.url}/pricing`,
      webhookUrl: `${siteConfig.url}/api/payments/webhook`,
      payCurrency: parsed.data.payCurrency,
      customerEmail: user.email,
    });

    await db
      .from("orders")
      .update({
        provider_payment_id: payment.providerPaymentId,
        provider_checkout_url: payment.checkoutUrl,
        pay_address: payment.payAddress ?? null,
        pay_amount: payment.payAmount ?? null,
        pay_currency: payment.payCurrency ?? null,
        expires_at: payment.expiresAt ?? null,
      })
      .eq("id", order.id);

    trackServer("credit_purchase_started", {
      planId: plan.id,
      amount: plan.price,
    });

    return NextResponse.json({
      orderId: order.id,
      checkoutUrl: payment.checkoutUrl,
    });
  } catch (err) {
    console.error("[payments/create] provider rejected checkout", {
      orderId: order.id,
      error: err instanceof Error ? err.message : String(err),
    });

    await db.from("orders").update({ status: "failed" }).eq("id", order.id);

    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 502 },
    );
  }
}
