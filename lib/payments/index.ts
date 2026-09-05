import "server-only";

import { NowPaymentsProvider } from "./providers/nowpayments";
import { DevPaymentProvider, isDevPaymentModeEnabled } from "./providers/dev";
import type { PaymentProvider } from "./types";

export * from "./types";
export { isDevPaymentModeEnabled };

/**
 * Provider factory. The dev simulator wins only when explicitly enabled
 * outside production; otherwise the configured crypto provider is used.
 */
const registry: Record<string, () => PaymentProvider> = {
  nowpayments: () => new NowPaymentsProvider(),
  dev: () => new DevPaymentProvider(),
};

let cached: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;

  if (isDevPaymentModeEnabled()) {
    cached = new DevPaymentProvider();
    return cached;
  }

  const name = process.env.CRYPTO_PAYMENT_PROVIDER ?? "nowpayments";
  const factory = registry[name];
  if (!factory) {
    throw new Error(
      `Unknown payment provider "${name}". Supported: ${Object.keys(registry).join(", ")}`,
    );
  }
  cached = factory();
  return cached;
}

/** True when a checkout can actually be created right now. */
export function isPaymentConfigured(): boolean {
  try {
    return getPaymentProvider().isConfigured();
  } catch {
    return false;
  }
}
