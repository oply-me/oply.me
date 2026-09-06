import "server-only";

import sharp from "sharp";
import {
  ImageProviderError,
  type ImageProvider,
  type GenerateImageRequest,
  type GenerateImageResult,
} from "./image-types";

/**
 * Returns a small in-memory solid-colour PNG instantly, so the rest of the
 * pipeline (credit reservation, Storage upload, ai_generations insert, signed
 * URL, refund-on-failure) is exercisable without a real OPENAI_API_KEY.
 * Selected via AI_IMAGE_PROVIDER=mock, mirroring how AI_PROVIDER already
 * selects between text providers in lib/ai/client.ts.
 *
 * Set MOCK_IMAGE_PROVIDER_FAIL=1 to force a (retryable) failure, for testing
 * the refund path.
 */
export class MockImageProvider implements ImageProvider {
  readonly name = "mock";

  isConfigured(): boolean {
    return true;
  }

  async generate(request: GenerateImageRequest): Promise<GenerateImageResult> {
    if (process.env.MOCK_IMAGE_PROVIDER_FAIL === "1") {
      throw new ImageProviderError("Mock provider forced failure.", undefined, true);
    }

    const { width, height } = request.size;
    const bytes = await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 124, g: 58, b: 237 },
      },
    })
      .png()
      .toBuffer();

    return {
      bytes,
      mimeType: "image/png",
      width,
      height,
      model: "mock-1",
      provider: this.name,
    };
  }
}
