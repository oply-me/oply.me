import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { DEFAULT_MODEL } from "@/lib/ai/models";
import {
  AIProviderError,
  type AIProvider,
  type GenerateRequest,
  type GenerateResult,
} from "./types";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.AI_API_KEY ?? process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new AIProviderError(
        "AI_API_KEY is not configured. Set it in your environment to enable generation.",
      );
    }
    client = new Anthropic({ apiKey, maxRetries: 2 });
  }
  return client;
}

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";

  isConfigured(): boolean {
    return Boolean(process.env.AI_API_KEY ?? process.env.ANTHROPIC_API_KEY);
  }

  async generate(request: GenerateRequest): Promise<GenerateResult> {
    const model = request.model ?? DEFAULT_MODEL;
    const maxTokens = request.maxTokens ?? 8000;

    try {
      // Structured tools go through the constrained-output path, so the
      // result is guaranteed to parse against the schema.
      if (request.schema) {
        const response = await getClient().messages.parse({
          model,
          max_tokens: maxTokens,
          system: request.system,
          thinking: { type: "adaptive" },
          output_config: {
            effort: request.effort ?? "medium",
            format: zodOutputFormat(request.schema),
          },
          messages: [{ role: "user", content: request.prompt }],
        });

        if (response.stop_reason === "refusal") {
          throw new AIProviderError(
            "The request was declined by the model's safety system.",
          );
        }

        const parsed = response.parsed_output;
        if (parsed == null) {
          throw new AIProviderError(
            "The model returned a result that did not match the expected format.",
            undefined,
            true,
          );
        }

        return {
          text: textOf(response.content),
          json: parsed,
          model: response.model ?? model,
          provider: this.name,
          inputTokens: response.usage?.input_tokens ?? null,
          outputTokens: response.usage?.output_tokens ?? null,
        };
      }

      const response = await getClient().messages.create({
        model,
        max_tokens: maxTokens,
        system: request.system,
        thinking: { type: "adaptive" },
        output_config: { effort: request.effort ?? "medium" },
        messages: [{ role: "user", content: request.prompt }],
      });

      if (response.stop_reason === "refusal") {
        throw new AIProviderError(
          "The request was declined by the model's safety system.",
        );
      }

      const text = textOf(response.content).trim();
      if (!text) {
        throw new AIProviderError("The model returned an empty result.", undefined, true);
      }

      return {
        text,
        json: null,
        model: response.model ?? model,
        provider: this.name,
        inputTokens: response.usage?.input_tokens ?? null,
        outputTokens: response.usage?.output_tokens ?? null,
      };
    } catch (err) {
      if (err instanceof AIProviderError) throw err;

      // Typed SDK errors, most specific first.
      if (err instanceof Anthropic.RateLimitError) {
        throw new AIProviderError(
          "The AI service is busy right now. Please try again in a moment.",
          err,
          true,
        );
      }
      if (err instanceof Anthropic.AuthenticationError) {
        throw new AIProviderError("The AI service is not configured correctly.", err);
      }
      if (err instanceof Anthropic.BadRequestError) {
        throw new AIProviderError("That request could not be processed.", err);
      }
      if (err instanceof Anthropic.APIConnectionError) {
        throw new AIProviderError(
          "Could not reach the AI service. Please try again.",
          err,
          true,
        );
      }
      if (err instanceof Anthropic.APIError) {
        throw new AIProviderError(
          "The AI service returned an error.",
          err,
          err.status ? err.status >= 500 : false,
        );
      }
      throw new AIProviderError("Generation failed.", err, true);
    }
  }
}

function textOf(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}
