/**
 * Parallel to lib/ai/providers/types.ts. Image generation doesn't fit that
 * text/JSON-shaped interface (no system/prompt-only signature makes sense for
 * size/background/input-image params, and the result is binary, not text) —
 * this is a deliberately separate contract, not a forced extension of it.
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface GenerateImageRequest {
  prompt: string;
  /** The exact pixel size the caller wants — providers may return something
   * coarser; lib/images/resize.ts fits the result to this afterward. */
  size: ImageDimensions;
  /** Present for an edit (Product Photo restaging, Background Remover) — absent for pure generation. */
  inputImage?: { bytes: Buffer; mimeType: string };
  background?: "transparent" | "opaque" | "auto";
  quality?: "low" | "medium" | "high" | "auto";
}

export interface GenerateImageResult {
  bytes: Buffer;
  mimeType: string;
  width: number;
  height: number;
  model: string;
  provider: string;
}

export class ImageProviderError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
    /** True when retrying the same request might succeed. */
    readonly retryable = false,
  ) {
    super(message);
    this.name = "ImageProviderError";
  }
}

/**
 * Every image provider implements this. Adding a second provider later means
 * writing one more class here — nothing above this interface changes.
 */
export interface ImageProvider {
  readonly name: string;
  isConfigured(): boolean;
  generate(request: GenerateImageRequest): Promise<GenerateImageResult>;
}
