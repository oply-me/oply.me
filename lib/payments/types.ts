import type { OrderStatus } from "@/lib/types/database";

/** Provider-specific states are normalised to our own order statuses. */
export type NormalizedStatus = OrderStatus;

export interface CreatePaymentParams {
  orderId: string;
  /** Authoritative amount, resolved server-side from config/pricing.ts. */
  amount: number;
  currency: string;
  description: string;
  /** Where the provider sends the user afterwards. */
  successUrl: string;
  cancelUrl: string;
  /** Where the provider POSTs status changes. */
  webhookUrl: string;
  /** Optional settlement currency chosen by the user, e.g. "usdttrc20". */
  payCurrency?: string;
  customerEmail?: string;
}

export interface CreatePaymentResult {
  providerPaymentId: string;
  checkoutUrl: string | null;
  payAddress?: string | null;
  payAmount?: number | null;
  payCurrency?: string | null;
  expiresAt?: string | null;
}

export interface PaymentStatusResult {
  providerPaymentId: string;
  status: NormalizedStatus;
  /** Our order id, echoed back by the provider where supported. */
  orderId?: string | null;
  amountPaid?: number | null;
  payCurrency?: string | null;
  actuallyPaid?: number | null;
}

export interface WebhookVerification {
  /** False means the signature did not match — reject the request. */
  valid: boolean;
  /** Stable per-event id. Stored with a UNIQUE constraint for idempotency. */
  eventId: string;
  eventType: string;
  orderId: string | null;
  providerPaymentId: string | null;
  status: NormalizedStatus;
  payload: unknown;
}

export interface SupportedCurrency {
  code: string;
  label: string;
  network?: string;
}

/**
 * Payment providers implement this. Crypto is the launch method; adding
 * Stripe or Razorpay later means adding a class here and an entry in the
 * factory — no page or API route changes.
 */
export interface PaymentProvider {
  readonly name: string;
  isConfigured(): boolean;
  /** Only currencies this provider is actually configured to accept. */
  supportedCurrencies(): Promise<SupportedCurrency[]>;
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  getPaymentStatus(providerPaymentId: string): Promise<PaymentStatusResult>;
  verifyWebhook(
    rawBody: string,
    headers: Headers,
  ): Promise<WebhookVerification | null>;
}

export class PaymentError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PaymentError";
  }
}
