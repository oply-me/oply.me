import { notFound } from "next/navigation";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/og-image";
import { getCategory } from "@/config/categories";
import { listTools } from "@/lib/tools/registry";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export async function generateImageMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const category = getCategory(params.slug);
  return [
    {
      id: "card",
      size,
      contentType,
      alt: category ? `${category.name} AI tools on Oply` : "Oply",
    },
  ];
}

/** Per-category card. The tool count is counted, never asserted. */
export default async function CategoryOgImage({
  params,
}: {
  params: { slug: string };
}) {
  const category = getCategory(params.slug);
  if (!category) notFound();

  const tools = await listTools();
  const count = tools.filter((t) => t.category === category.slug).length;

  return renderOgImage({
    eyebrow: "Category",
    title: `${category.name} AI tools`,
    subtitle: category.description,
    categorySlug: category.slug,
    badge: `${count} ${count === 1 ? "tool" : "tools"}`,
  });
}
