import {
  GLOBAL_SYSTEM_RULES,
  type ToolDefinition,
  type ToolField,
} from "@/config/tools";

export type RefineAction = "shorten" | "expand" | "improve";

const REFINE_INSTRUCTIONS: Record<RefineAction, string> = {
  shorten:
    "Rewrite the previous result so it is roughly 40% shorter. Keep every substantive point; cut restatement, hedging and filler. Preserve the original format.",
  expand:
    "Expand the previous result with more depth — concrete detail, examples and reasoning. Do not pad with restatement, and do not introduce facts that were not implied by the original inputs. Preserve the original format.",
  improve:
    "Rewrite the previous result to be clearer and stronger: tighter sentences, better structure, more specific word choice. Keep the same meaning, length and format.",
};

/** Full system prompt for a tool: its own instructions plus the global rules. */
export function buildSystemPrompt(
  tool: ToolDefinition,
  overridePrompt?: string | null,
): string {
  return `${overridePrompt?.trim() || tool.systemPrompt}\n\n---\n\n${GLOBAL_SYSTEM_RULES}`;
}

function labelFor(field: ToolField, value: string): string {
  if (field.type === "select" && field.options) {
    return field.options.find((o) => o.value === value)?.label ?? value;
  }
  return value;
}

/**
 * Renders the user's field values into a labelled block. Long free-text
 * fields are fenced so the model can tell input from instruction.
 */
export function buildUserPrompt(
  tool: ToolDefinition,
  input: Record<string, string>,
): string {
  const parts: string[] = [];

  for (const field of tool.fields) {
    const raw = input[field.name];
    if (raw == null) continue;
    const value = String(raw).trim();
    if (!value) continue;

    if (field.type === "textarea" && value.length > 200) {
      parts.push(`${field.label}:\n"""\n${value}\n"""`);
    } else {
      parts.push(`${field.label}: ${labelFor(field, value)}`);
    }
  }

  if (parts.length === 0) {
    return "No input was provided. Ask for the missing details in one short sentence.";
  }

  return parts.join("\n\n");
}

/** Prompt for a follow-up action that operates on a previous result. */
export function buildRefinePrompt(
  tool: ToolDefinition,
  input: Record<string, string>,
  previousOutput: string,
  action: RefineAction,
): string {
  return [
    buildUserPrompt(tool, input),
    "",
    "Previous result:",
    '"""',
    previousOutput,
    '"""',
    "",
    REFINE_INSTRUCTIONS[action],
  ].join("\n");
}

/** A short, readable snippet of the input for history rows. */
export function buildInputPreview(
  tool: ToolDefinition,
  input: Record<string, string>,
): string {
  const primary =
    tool.fields.find((f) => f.required && f.type === "textarea") ??
    tool.fields.find((f) => f.type === "textarea") ??
    tool.fields.find((f) => f.required) ??
    tool.fields[0];

  const value = primary ? (input[primary.name] ?? "") : "";
  const clean = String(value).replace(/\s+/g, " ").trim();
  return clean.length > 180 ? `${clean.slice(0, 179)}…` : clean;
}
