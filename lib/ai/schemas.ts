import { z } from "zod";
import type { OutputSchemaKey } from "@/config/tools";

/**
 * Output shapes for tools that return structured data rather than prose.
 * The Anthropic provider turns these into a constrained output format, so the
 * result is guaranteed to parse.
 */

export const seoMetaSchema = z.object({
  seo_title: z.string(),
  meta_description: z.string(),
  slug: z.string(),
  og_title: z.string(),
  og_description: z.string(),
});

export const productDescriptionSchema = z.object({
  short_description: z.string(),
  long_description: z.string(),
  bullet_points: z.array(z.string()),
  seo_title: z.string(),
  meta_description: z.string(),
  tags: z.array(z.string()),
  cta: z.string(),
});

export const blogOutlineSchema = z.object({
  h1: z.string(),
  introduction_idea: z.string(),
  sections: z.array(
    z.object({
      h2: z.string(),
      key_points: z.array(z.string()),
      subsections: z.array(z.string()),
    }),
  ),
  conclusion: z.string(),
  faq_ideas: z.array(z.string()),
});

export const promptOptimizerSchema = z.object({
  optimized_prompt: z.string(),
  improvements: z.array(
    z.object({
      area: z.string(),
      change: z.string(),
    }),
  ),
});

export const replySchema = z.object({
  short: z.string(),
  standard: z.string(),
  detailed: z.string(),
});

export const outputSchemas = {
  seoMeta: seoMetaSchema,
  productDescription: productDescriptionSchema,
  blogOutline: blogOutlineSchema,
  promptOptimizer: promptOptimizerSchema,
  reply: replySchema,
} satisfies Record<OutputSchemaKey, z.ZodType>;

export function getOutputSchema(key: OutputSchemaKey) {
  return outputSchemas[key];
}

export type SeoMetaOutput = z.infer<typeof seoMetaSchema>;
export type ProductDescriptionOutput = z.infer<typeof productDescriptionSchema>;
export type BlogOutlineOutput = z.infer<typeof blogOutlineSchema>;
export type PromptOptimizerOutput = z.infer<typeof promptOptimizerSchema>;
export type ReplyOutput = z.infer<typeof replySchema>;
