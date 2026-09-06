import type { ToolDefinition } from "@/config/tools";

/**
 * The only fields the ⌘K palette actually reads.
 *
 * Kept separate from `PublicTool` because the palette is mounted on every
 * marketing and dashboard page: sending the full definition put ~68KB of tool
 * config (prompts aside — fields, FAQ, keyword layers, how-it-works, SEO copy)
 * into every page's payload to render a list of five properties.
 */
export interface ToolSearchItem {
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: string;
}

export function toSearchItem(tool: ToolDefinition): ToolSearchItem {
  return {
    slug: tool.slug,
    name: tool.name,
    description: tool.description,
    category: tool.category,
    icon: tool.icon,
  };
}
