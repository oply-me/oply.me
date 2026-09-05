import { z } from "zod";
import type { ToolDefinition } from "@/config/tools";

/** Hard ceiling on request bodies, checked before parsing. */
export const MAX_REQUEST_BYTES = 200_000;

export const generateRequestSchema = z.object({
  toolSlug: z.string().min(1).max(100),
  input: z.record(z.string(), z.string().max(40_000)),
  projectId: z.string().uuid().nullable().optional(),
  action: z.enum(["generate", "shorten", "expand", "improve"]).optional(),
  previousOutput: z.string().max(60_000).optional(),
});

export type GenerateRequestBody = z.infer<typeof generateRequestSchema>;

export const createPaymentSchema = z.object({
  planId: z.string().min(1).max(50),
  payCurrency: z.string().min(2).max(20).optional(),
});

export const contactSchema = z.object({
  name: z.string().min(1, "Please enter your name.").max(120),
  email: z.string().email("Please enter a valid email address.").max(200),
  message: z
    .string()
    .min(10, "Please write at least a sentence.")
    .max(5_000, "Please keep your message under 5,000 characters."),
});

export const projectSchema = z.object({
  name: z.string().min(1, "Give the project a name.").max(120),
  description: z.string().max(500).optional().nullable(),
});

export const profileSchema = z.object({
  full_name: z.string().max(120).optional().nullable(),
  avatar_url: z.string().url().max(500).optional().nullable().or(z.literal("")),
  primary_use_case: z.string().max(60).optional().nullable(),
});

/**
 * Builds a validator from a tool's own field definitions, so required fields,
 * lengths and select options are enforced server-side rather than trusted
 * from the browser.
 */
export function buildToolInputSchema(tool: ToolDefinition) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of tool.fields) {
    let schema: z.ZodTypeAny;

    if (field.type === "select" && field.options?.length) {
      const values = field.options.map((o) => o.value);
      schema = z
        .string()
        .refine((v) => values.includes(v), {
          message: `${field.label} must be one of: ${values.join(", ")}`,
        });
    } else {
      let s = z.string().max(
        field.maxLength ?? tool.maxInputChars,
        `${field.label} is too long.`,
      );
      if (field.required) {
        s = s.min(1, `${field.label} is required.`);
      }
      schema = s;
    }

    shape[field.name] = field.required ? schema : schema.optional();
  }

  return z.object(shape);
}

/** Applies select defaults and strips unknown keys before validation. */
export function normalizeToolInput(
  tool: ToolDefinition,
  input: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of tool.fields) {
    const value = input[field.name];
    if (value != null && String(value).trim() !== "") {
      out[field.name] = String(value);
    } else if (field.defaultValue) {
      out[field.name] = field.defaultValue;
    }
  }
  return out;
}
