import "server-only";

import {
  getEnabledTools,
  getTool,
  type ToolDefinition,
  type PublicTool,
  toPublicTool,
} from "@/config/tools";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The registry resolves a tool from two layers:
 *
 *   1. config/tools.ts — the shipped defaults, and the only place fields,
 *      prompts and SEO copy are authored.
 *   2. the `tools` table — admin overrides for the operational fields
 *      (credit cost, enabled, featured, sort order, description, prompt).
 *
 * The DB layer is optional: before `npm run db:sync-tools` has run, or if the
 * database is unreachable, the file registry is used as-is. That keeps the
 * public site working while still letting an admin retune costs at runtime.
 */

/** Operational fields an admin is allowed to override. */
interface ToolOverride {
  credit_cost: number;
  enabled: boolean;
  featured: boolean;
  sort_order: number;
  description: string | null;
  tagline: string | null;
  new_until: string | null;
}

function applyOverride(
  tool: ToolDefinition,
  override: Partial<ToolOverride> | undefined,
): ToolDefinition {
  if (!override) return tool;
  return {
    ...tool,
    creditCost: override.credit_cost ?? tool.creditCost,
    enabled: override.enabled ?? tool.enabled,
    featured: override.featured ?? tool.featured,
    sortOrder: override.sort_order ?? tool.sortOrder,
    description: override.description ?? tool.description,
    tagline: override.tagline ?? tool.tagline,
    newUntil: override.new_until ?? tool.newUntil,
  };
}

async function loadOverrides(): Promise<Map<string, ToolOverride>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tools")
      .select(
        "slug, credit_cost, enabled, featured, sort_order, description, tagline, new_until",
      );
    if (error || !data) return new Map();
    return new Map(data.map((row) => [row.slug, row as unknown as ToolOverride]));
  } catch {
    return new Map();
  }
}

/** All enabled tools with admin overrides applied, in display order. */
export async function listTools(): Promise<ToolDefinition[]> {
  const overrides = await loadOverrides();
  return getEnabledTools()
    .map((t) => applyOverride(t, overrides.get(t.slug)))
    .filter((t) => t.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function listPublicTools(): Promise<PublicTool[]> {
  return (await listTools()).map(toPublicTool);
}

/** A single tool for a public page. Returns null when missing or disabled. */
export async function findTool(slug: string): Promise<ToolDefinition | null> {
  const base = getTool(slug);
  if (!base) return null;
  const overrides = await loadOverrides();
  const resolved = applyOverride(base, overrides.get(slug));
  return resolved.enabled ? resolved : null;
}

export async function findPublicTool(slug: string): Promise<PublicTool | null> {
  const tool = await findTool(slug);
  return tool ? toPublicTool(tool) : null;
}

export async function listToolsByCategory(
  categorySlug: string,
): Promise<ToolDefinition[]> {
  return (await listTools()).filter((t) => t.category === categorySlug);
}

export async function listFeaturedTools(limit = 6): Promise<ToolDefinition[]> {
  return (await listTools()).filter((t) => t.featured).slice(0, limit);
}

export async function getRelatedTools(
  tool: ToolDefinition,
  limit = 3,
): Promise<ToolDefinition[]> {
  const all = await listTools();
  const bySlug = new Map(all.map((t) => [t.slug, t]));

  const related = tool.related
    .map((slug) => bySlug.get(slug))
    .filter((t): t is ToolDefinition => Boolean(t));

  if (related.length >= limit) return related.slice(0, limit);

  // Backfill from the same category so the section is never half-empty.
  const filler = all.filter(
    (t) =>
      t.slug !== tool.slug &&
      t.category === tool.category &&
      !related.some((r) => r.slug === t.slug),
  );

  return [...related, ...filler].slice(0, limit);
}

/**
 * Server-authoritative resolution used by the generation endpoint.
 *
 * Reads through the service role so it can see `system_prompt`, and treats
 * the DB row as the source of truth for credit cost — a client-supplied cost
 * is never consulted anywhere in the request path.
 */
export interface GenerationTool {
  tool: ToolDefinition;
  creditCost: number;
  systemPromptOverride: string | null;
  enabled: boolean;
}

export async function resolveToolForGeneration(
  slug: string,
): Promise<GenerationTool | null> {
  const base = getTool(slug);
  if (!base) return null;

  let creditCost = base.creditCost;
  let enabled = base.enabled;
  let systemPromptOverride: string | null = null;

  try {
    const db = createAdminClient();
    const { data } = await db
      .from("tools")
      .select("credit_cost, enabled, system_prompt")
      .eq("slug", slug)
      .maybeSingle();

    if (data) {
      creditCost = data.credit_cost;
      enabled = data.enabled;
      systemPromptOverride = data.system_prompt;
    }
  } catch {
    // Fall back to the file registry — the shipped defaults are still
    // authoritative server-side values, just not admin-editable right now.
  }

  return { tool: base, creditCost, systemPromptOverride, enabled };
}
