import "server-only";

import { OpenAIImageProvider } from "./providers/openai-images";
import { MockImageProvider } from "./providers/mock-image";
import type { ImageProvider } from "./providers/image-types";

/**
 * Mirrors lib/ai/client.ts. AI_IMAGE_PROVIDER selects the implementation;
 * "mock" exists so the image pipeline is testable end to end without a real
 * OPENAI_API_KEY (see lib/ai/providers/mock-image.ts).
 */
const providers: Record<string, () => ImageProvider> = {
  openai: () => new OpenAIImageProvider(),
  mock: () => new MockImageProvider(),
};

let cached: ImageProvider | null = null;

export function getImageProvider(): ImageProvider {
  if (cached) return cached;
  const name = process.env.AI_IMAGE_PROVIDER ?? "openai";
  const factory = providers[name];
  if (!factory) {
    throw new Error(
      `Unknown AI_IMAGE_PROVIDER "${name}". Supported: ${Object.keys(providers).join(", ")}`,
    );
  }
  cached = factory();
  return cached;
}

export function isImageAIConfigured(): boolean {
  try {
    return getImageProvider().isConfigured();
  } catch {
    return false;
  }
}
