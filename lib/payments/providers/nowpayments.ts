import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import {
  PaymentError,
  type CreatePaymentParams,
  type CreatePaymentResult,
  type NormalizedStatus,
  type PaymentProvider,
  type PaymentStatusResult,
  type SupportedCurrency,
  type WebhookVerification,
} from "../types";

const API_BASE = process.env.CRYPTO_PAYMENT_API_URL ?? "https://api.nowpayments.io/v1";

/** Provider payment states mapped onto our order lifecycle. */
const STATUS_MAP: Record<string, NormalizedStatus> = {
  waiting: "pending",
  confirming: "processing",
  confirmed: "processing",
  sending: "processing",
  partially_paid: "processing",
  finished: "completed",
  failed: "failed",
  refunded: "refunded",
  expired: "expired",
};

function normalizeStatus(raw: string | undefined): NormalizedStatus {
  if (!raw) return "pending";
  return STATUS_MAP[raw.toLowerCase()] ?? "pending";
}

/**
 * Recursively sorts object keys. The provider signs the JSON body with keys
 * in sorted order, so the same normalisation has to happen here before the
 * HMAC is recomputed.
 */
function sortedJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortedJson);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortedJson((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

export class NowPaymentsProvider implements PaymentProvider {
  readonly name = "nowpayments";

  private get apiKey() {
    return process.env.CRYPTO_PAYMENT_API_KEY;
  }

  private get ipnSecret() {
    return process.env.CRYPTO_PAYMENT_WEBHOOK_SECRET;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.ipnSecret);
  }

  private async request<T>(
    path: string,
    init?: RequestInit & { body?: string },
  ): Promise<T> {
    if (!this.apiKey) {
      throw new PaymentError("Crypto payments are not configured.");
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "x-api-key": this.apiKey,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });

    const text = await response.text();

    if (!response.ok) {
      // Log the provider's own message, but never surface it to the user.
      console.error("[payments/nowpayments] request failed", {
        path,
        status: response.status,
        body: text.slice(0, 500),
      });
      throw new PaymentError("The payment provider rejected the request.");
    }

    return JSON.parse(text) as T;
  }

  async supportedCurrencies(): Promise<SupportedCurrency[]> {
    if (!this.isConfigured()) return [];
    try {
      const data = await this.request<{ selectedCurrencies?: string[]; currencies?: string[] }>(
        "/merchant/coins",
      );
      const codes = data.selectedCurrencies ?? data.currencies ?? [];
      return codes.map((code) => ({
        code,
        label: code.toUpperCase(),
        network: inferNetwork(code),
      }));
    } catch (err) {
      console.error("[payments/nowpayments] could not load currencies", err);
      return [];
    }
  }

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const invoice = await this.request<{
      id: string | number;
      invoice_url?: string;
      pay_address?: string;
      pay_amount?: number;
      pay_currency?: string;
      expiration_estimate_date?: string;
    }>("/invoice", {
      method: "POST",
      body: JSON.stringify({
        price_amount: params.amount,
        price_currency: params.currency.toLowerCase(),
        order_id: params.orderId,
        order_description: params.description,
        ipn_callback_url: params.webhookUrl,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        // Without this, NOWPayments deducts its own processing fee from what
        // we actually receive — on a small order that's enough to land the
        // payment as "partially received" even though the customer paid the
        // full quoted price. This shifts that fee onto the customer instead,
        // so price_amount above is what we're guaranteed to receive.
        is_fee_paid_by_user: true,
        ...(params.payCurrency ? { pay_currency: params.payCurrency } : {}),
      }),
    });

    return {
      providerPaymentId: String(invoice.id),
      checkoutUrl: invoice.invoice_url ?? null,
      payAddress: invoice.pay_address ?? null,
      payAmount: invoice.pay_amount ?? null,
      payCurrency: invoice.pay_currency ?? null,
      expiresAt: invoice.expiration_estimate_date ?? null,
    };
  }

  async getPaymentStatus(providerPaymentId: string): Promise<PaymentStatusResult> {
    const data = await this.request<{
      payment_id: string | number;
      payment_status: string;
      order_id?: string;
      price_amount?: number;
      pay_currency?: string;
      actually_paid?: number;
    }>(`/payment/${encodeURIComponent(providerPaymentId)}`);

    return {
      providerPaymentId: String(data.payment_id),
      status: normalizeStatus(data.payment_status),
      orderId: data.order_id ?? null,
      amountPaid: data.price_amount ?? null,
      payCurrency: data.pay_currency ?? null,
      actuallyPaid: data.actually_paid ?? null,
    };
  }

  /**
   * Verifies the IPN HMAC. Returns null when the signature is absent or does
   * not match — the caller must treat that as a rejected request and must not
   * process the payload.
   */
  async verifyWebhook(
    rawBody: string,
    headers: Headers,
  ): Promise<WebhookVerification | null> {
    const signature = headers.get("x-nowpayments-sig");
    if (!signature || !this.ipnSecret) return null;

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return null;
    }

    const expected = createHmac("sha512", this.ipnSecret)
      .update(JSON.stringify(sortedJson(parsed)))
      .digest("hex");

    const received = Buffer.from(signature, "utf8");
    const computed = Buffer.from(expected, "utf8");

    if (
      received.length !== computed.length ||
      !timingSafeEqual(received, computed)
    ) {
      return null;
    }

    const paymentId = parsed.payment_id != null ? String(parsed.payment_id) : null;
    const status = String(parsed.payment_status ?? "");

    return {
      valid: true,
      // The provider does not send a distinct event id, so payment + status
      // forms the natural idempotency key: one credit grant per payment
      // reaching a given state.
      eventId: `${paymentId ?? "unknown"}:${status}`,
      eventType: status,
      orderId: parsed.order_id != null ? String(parsed.order_id) : null,
      providerPaymentId: paymentId,
      status: normalizeStatus(status),
      payload: parsed,
    };
  }
}

function inferNetwork(code: string): string | undefined {
  const c = code.toLowerCase();
  if (c.includes("trc20")) return "TRON (TRC-20)";
  if (c.includes("erc20")) return "Ethereum (ERC-20)";
  if (c.includes("bsc")) return "BNB Smart Chain";
  if (c.includes("sol")) return "Solana";
  if (c.includes("matic") || c.includes("polygon")) return "Polygon";
  if (c === "btc") return "Bitcoin";
  if (c === "eth") return "Ethereum";
  return undefined;
}
