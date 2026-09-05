import "server-only";

import { AnthropicProvider } from "./providers/anthropic";
import type { AIProvider } from "./providers/types";

/**
 * Provider factory. AI_PROVIDER selects the implementation; adding OpenAI or
 * Gemini means registering one more entry here.
 */
const providers: Record<string, () => AIProvider> = {
  anthropic: () => new AnthropicProvider(),
};

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const name = process.env.AI_PROVIDER ?? "anthropic";
  const factory = providers[name];
  if (!factory) {
    throw new Error(
      `Unknown AI_PROVIDER "${name}". Supported: ${Object.keys(providers).join(", ")}`,
    );
  }
  cached = factory();
  return cached;
}

export function isAIConfigured(): boolean {
  try {
    return getAIProvider().isConfigured();
  } catch {
    return false;
  }
}
