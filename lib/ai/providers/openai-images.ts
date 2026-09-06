import "server-only";

import {
  ImageProviderError,
  type ImageProvider,
  type GenerateImageRequest,
  type GenerateImageResult,
} from "./image-types";

const API_BASE = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-image-1";

/** OpenAI's image endpoints only accept these three native sizes. */
type NativeSize = "1024x1024" | "1536x1024" | "1024x1536";

function nativeSizeFor(size: { width: number; height: number }): NativeSize {
  const ratio = size.width / size.height;
  if (ratio > 1.15) return "1536x1024";
  if (ratio < 1 / 1.15) return "1024x1536";
  return "1024x1024";
}

function dimensionsOf(size: NativeSize): { width: number; height: number } {
  const [width, height] = size.split("x").map(Number);
  return { width, height };
}

function apiKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

async function parseErrorBody(response: Response): Promise<{ message?: string; code?: string }> {
  try {
    const body = (await response.json()) as { error?: { message?: string; code?: string } };
    return body.error ?? {};
  } catch {
    return {};
  }
}

export class OpenAIImageProvider implements ImageProvider {
  readonly name = "openai";

  isConfigured(): boolean {
    return Boolean(apiKey());
  }

  async generate(request: GenerateImageRequest): Promise<GenerateImageResult> {
    const key = apiKey();
    if (!key) {
      throw new ImageProviderError(
        "OPENAI_API_KEY is not configured. Set it in your environment to enable image generation.",
      );
    }

    const model = process.env.OPENAI_IMAGE_MODEL ?? DEFAULT_MODEL;
    const nativeSize = nativeSizeFor(request.size);
    const quality = request.quality ?? "auto";

    try {
      const response = request.inputImage
        ? await this.callEdit(key, model, request, nativeSize, quality)
        : await this.callGenerate(key, model, request, nativeSize, quality);

      if (!response.ok) {
        throw await this.toProviderError(response);
      }

      const body = (await response.json()) as { data?: { b64_json?: string }[] };
      const b64 = body.data?.[0]?.b64_json;
      if (!b64) {
        throw new ImageProviderError(
          "The model returned a result with no image data.",
          undefined,
          true,
        );
      }

      const dims = dimensionsOf(nativeSize);
      return {
        bytes: Buffer.from(b64, "base64"),
        mimeType: "image/png",
        width: dims.width,
        height: dims.height,
        model,
        provider: this.name,
      };
    } catch (err) {
      if (err instanceof ImageProviderError) throw err;
      throw new ImageProviderError(
        "Could not reach the AI image service. Please try again.",
        err,
        true,
      );
    }
  }

  private callGenerate(
    key: string,
    model: string,
    request: GenerateImageRequest,
    size: NativeSize,
    quality: string,
  ): Promise<Response> {
    return fetch(`${API_BASE}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: request.prompt,
        size,
        quality,
        background: request.background ?? "auto",
        n: 1,
      }),
    });
  }

  private callEdit(
    key: string,
    model: string,
    request: GenerateImageRequest,
    size: NativeSize,
    quality: string,
  ): Promise<Response> {
    const form = new FormData();
    form.set("model", model);
    form.set("prompt", request.prompt);
    form.set("size", size);
    form.set("quality", quality);
    if (request.background) form.set("background", request.background);
    form.set("n", "1");
    form.set(
      "image",
      new Blob([new Uint8Array(request.inputImage!.bytes)], {
        type: request.inputImage!.mimeType,
      }),
      "input",
    );

    return fetch(`${API_BASE}/images/edits`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
  }

  private async toProviderError(response: Response): Promise<ImageProviderError> {
    const { message, code } = await parseErrorBody(response);

    if (response.status === 401) {
      return new ImageProviderError("The AI image service is not configured correctly.");
    }
    if (response.status === 429) {
      return new ImageProviderError(
        "The AI image service is busy right now. Please try again in a moment.",
        undefined,
        true,
      );
    }
    if (code === "content_policy_violation" || response.status === 400) {
      return new ImageProviderError(
        message ?? "That request could not be processed.",
      );
    }
    if (response.status >= 500) {
      return new ImageProviderError(
        "The AI image service returned an error.",
        undefined,
        true,
      );
    }
    return new ImageProviderError(message ?? "Image generation failed.");
  }
}
