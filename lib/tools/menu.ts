import { categories } from "@/config/categories";
import { getEnabledTools } from "@/config/tools";

/** How many tools each category shows in the mega-menu before "View all". */
export const MENU_TOOLS_PER_CATEGORY = 4;

export interface MegaMenuTool {
  slug: string;
  name: string;
  tagline: string;
  icon: string;
}

export interface MegaMenuCategory {
  slug: string;
  name: string;
  icon: string;
  /** A slice, not the whole category — `toolCount` is the real total. */
  tools: MegaMenuTool[];
  toolCount: number;
}

export interface ToolsMenu {
  categories: MegaMenuCategory[];
  totalTools: number;
}

/**
 * Groups the live tool registry for the header menu.
 *
 * Built from `getEnabledTools()` — the same source the tools page, the footer
 * and the sitemap read — so the menu cannot drift from what actually ships.
 * Empty categories are dropped rather than rendered as a dead column.
 */
export function getToolsMenu(): ToolsMenu {
  const tools = getEnabledTools();

  const grouped = categories
    .filter((category) => category.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => {
      const inCategory = tools.filter((t) => t.category === category.slug);
      return {
        slug: category.slug,
        name: category.name,
        icon: category.icon,
        toolCount: inCategory.length,
        tools: inCategory.slice(0, MENU_TOOLS_PER_CATEGORY).map((t) => ({
          slug: t.slug,
          name: t.name,
          tagline: t.tagline,
          icon: t.icon,
        })),
      };
    })
    .filter((category) => category.toolCount > 0);

  return { categories: grouped, totalTools: tools.length };
}
