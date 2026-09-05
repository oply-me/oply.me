import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { categories } from "@/config/categories";
import { listTools } from "@/lib/tools/registry";

/** Public, indexable routes only — dashboard, admin and auth are excluded. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const tools = await listTools();
  const activeCategories = new Set(tools.map((t) => t.category));

  const staticRoutes: MetadataRoute.Sitemap = (
    [
      ["", "weekly", 1],
      ["/tools", "weekly", 0.9],
      ["/pricing", "monthly", 0.9],
      ["/categories", "monthly", 0.7],
      ["/features", "monthly", 0.6],
      ["/roadmap", "monthly", 0.5],
      ["/about", "yearly", 0.4],
      ["/faq", "monthly", 0.5],
      ["/contact", "yearly", 0.4],
      ["/privacy", "yearly", 0.3],
      ["/terms", "yearly", 0.3],
      ["/refund-policy", "yearly", 0.3],
    ] as const
  ).map(([path, changeFrequency, priority]) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const toolRoutes: MetadataRoute.Sitemap = tools.map((tool) => ({
    url: `${siteConfig.url}/tools/${tool.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((c) => c.enabled && activeCategories.has(c.slug))
    .map((category) => ({
      url: `${siteConfig.url}/categories/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  return [...staticRoutes, ...toolRoutes, ...categoryRoutes];
}
