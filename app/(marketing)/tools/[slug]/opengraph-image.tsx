import { notFound } from "next/navigation";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/og-image";
import { getCategory } from "@/config/categories";
import { findTool } from "@/lib/tools/registry";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export async function generateImageMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const tool = await findTool(params.slug);
  return [
    {
      id: "card",
      size,
      contentType,
      alt: tool ? `${tool.name} — ${tool.tagline}` : "Oply",
    },
  ];
}

/** Per-tool card: the tool's own name, tagline, credit cost and category hue. */
export default async function ToolOgImage({
  params,
}: {
  params: { slug: string };
}) {
  const tool = await findTool(params.slug);
  if (!tool) notFound();

  const category = getCategory(tool.category);

  return renderOgImage({
    eyebrow: category?.name,
    title: tool.name,
    subtitle: tool.tagline,
    categorySlug: tool.category,
    badge: `${tool.creditCost} credits per run`,
  });
}
