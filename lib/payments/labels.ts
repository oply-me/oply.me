/**
 * Display names for the `orders.payment_provider` values actually written by
 * `app/api/payments/create/route.ts`. Kept out of `lib/payments/index.ts` so a
 * client component can import it without pulling in the provider SDKs.
 */
export const PAYMENT_PROVIDER_LABEL: Record<string, string> = {
  paddle: "Card (Paddle)",
  nowpayments: "Crypto (NOWPayments)",
  dev: "Test payment",
};

export function paymentProviderLabel(provider: string | null | undefined): string {
  if (!provider) return "—";
  return PAYMENT_PROVIDER_LABEL[provider] ?? provider;
}
