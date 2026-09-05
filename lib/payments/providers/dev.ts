import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import {
  type CreatePaymentParams,
  type CreatePaymentResult,
  type PaymentProvider,
  type PaymentStatusResult,
  type SupportedCurrency,
  type WebhookVerification,
} from "../types";

/**
 * Development-only payment simulator.
 *
 * Guarded twice: it is only selected when DEV_PAYMENT_MODE is explicitly
 * "true" AND NODE_ENV is not "production". It exists so the full order →
 * webhook → credit flow can be exercised without provider credentials; it is
 * never a production code path.
 *
 * Even here the webhook is signed and verified, so the simulated flow tests
 * the same verification logic the real provider goes through.
 */
export class DevPaymentProvider implements PaymentProvider {
  readonly name = "dev";

  private get secret() {
    return process.env.CRYPTO_PAYMENT_WEBHOOK_SECRET ?? "dev-secret";
  }

  isConfigured(): boolean {
    return isDevPaymentModeEnabled();
  }

  async supportedCurrencies(): Promise<SupportedCurrency[]> {
    return [
      { code: "usdttrc20", label: "USDT", network: "TRON (TRC-20) — simulated" },
      { code: "btc", label: "BTC", network: "Bitcoin — simulated" },
    ];
  }

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    return {
      providerPaymentId: `dev_${params.orderId}`,
      // Keeps the user inside our own checkout page, which renders a
      // "simulate payment" control in development.
      checkoutUrl: null,
      payAddress: "DEV-SIMULATED-ADDRESS-DO-NOT-SEND-FUNDS",
      payAmount: params.amount,
      payCurrency: params.payCurrency ?? "usdttrc20",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
  }

  async getPaymentStatus(providerPaymentId: string): Promise<PaymentStatusResult> {
    return { providerPaymentId, status: "pending" };
  }

  async verifyWebhook(
    rawBody: string,
    headers: Headers,
  ): Promise<WebhookVerification | null> {
    if (!isDevPaymentModeEnabled()) return null;

    const signature = headers.get("x-dev-payment-sig");
    if (!signature) return null;

    const expected = createHmac("sha512", this.secret).update(rawBody).digest("hex");
    const a = Buffer.from(signature, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const parsed = JSON.parse(rawBody) as Record<string, unknown>;
    const status = String(parsed.payment_status ?? "finished");

    return {
      valid: true,
      eventId: `${String(parsed.payment_id)}:${status}`,
      eventType: status,
      orderId: parsed.order_id != null ? String(parsed.order_id) : null,
      providerPaymentId: parsed.payment_id != null ? String(parsed.payment_id) : null,
      status: status === "finished" ? "completed" : "pending",
      payload: parsed,
    };
  }

  /** Signs a simulated payload the way the real provider would. */
  sign(rawBody: string): string {
    return createHmac("sha512", this.secret).update(rawBody).digest("hex");
  }
}

export function isDevPaymentModeEnabled(): boolean {
  return (
    process.env.DEV_PAYMENT_MODE === "true" &&
    process.env.NODE_ENV !== "production"
  );
}
