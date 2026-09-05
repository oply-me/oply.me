/**
 * Model registry and price table.
 *
 * Prices are per million tokens and are used only to produce the
 * "estimated AI cost" figure in the admin dashboard. Providers report token
 * counts; the dollar figure is our own arithmetic, so it is always labelled
 * as an estimate rather than billing truth.
 */
export interface ModelInfo {
  id: string;
  provider: "anthropic" | "openai" | "gemini";
  label: string;
  inputPricePerMTok: number;
  outputPricePerMTok: number;
  contextWindow: number;
}

export const MODELS: Record<string, ModelInfo> = {
  "claude-opus-5": {
    id: "claude-opus-5",
    provider: "anthropic",
    label: "Claude Opus 5",
    inputPricePerMTok: 5,
    outputPricePerMTok: 25,
    contextWindow: 1_000_000,
  },
  "claude-sonnet-5": {
    id: "claude-sonnet-5",
    provider: "anthropic",
    label: "Claude Sonnet 5",
    inputPricePerMTok: 2,
    outputPricePerMTok: 10,
    contextWindow: 1_000_000,
  },
  "claude-haiku-4-5": {
    id: "claude-haiku-4-5",
    provider: "anthropic",
    label: "Claude Haiku 4.5",
    inputPricePerMTok: 1,
    outputPricePerMTok: 5,
    contextWindow: 200_000,
  },
};

export const DEFAULT_MODEL = process.env.AI_MODEL ?? "claude-opus-5";

export function getModelInfo(id: string): ModelInfo | undefined {
  return MODELS[id];
}

/** Returns an estimated USD cost, or null when the model has no price entry. */
export function estimateCost(
  modelId: string,
  inputTokens: number | null | undefined,
  outputTokens: number | null | undefined,
): number | null {
  const model = getModelInfo(modelId);
  if (!model || inputTokens == null || outputTokens == null) return null;
  return (
    (inputTokens / 1_000_000) * model.inputPricePerMTok +
    (outputTokens / 1_000_000) * model.outputPricePerMTok
  );
}
