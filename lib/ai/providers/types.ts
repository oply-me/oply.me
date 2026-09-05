import type { z } from "zod";

export interface GenerateRequest {
  system: string;
  prompt: string;
  /** When present the provider must return JSON matching this schema. */
  schema?: z.ZodType;
  maxTokens?: number;
  /** Depth/spend tradeoff. Cheap tools run low; long-form runs high. */
  effort?: "low" | "medium" | "high";
  model?: string;
}

export interface GenerateResult {
  text: string;
  json: unknown | null;
  model: string;
  provider: string;
  inputTokens: number | null;
  outputTokens: number | null;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
    /** True when retrying the same request might succeed. */
    readonly retryable = false,
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}

/**
 * Every provider implements this. Adding OpenAI or Gemini later means writing
 * one more class here — nothing above this interface changes.
 */
export interface AIProvider {
  readonly name: string;
  isConfigured(): boolean;
  generate(request: GenerateRequest): Promise<GenerateResult>;
}
