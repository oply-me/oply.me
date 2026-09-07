/**
 * Brand illustrations for the dashboard empty states.
 *
 * Unlike scripts/gen-samples.ts these are not tool output — they are static
 * decoration, so they are authored here rather than through a tool prompt.
 * Kept abstract and text-free on purpose: an image model cannot spell
 * reliably, and a misspelt illustration would ship a defect into the product.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getImageProvider } from "../lib/ai/image-client";

const OUT = path.resolve(process.cwd(), "public/illustrations");

/** Shared style clause so the set reads as one family. */
const STYLE =
  "Soft 3D isometric illustration, matte clay-like surfaces, rounded geometry, " +
  "violet and lavender palette (#6D3DF5, #8B5CF6) with a single soft cyan accent, " +
  "on a fully transparent background, gentle ambient shadow, no text, no letters, " +
  "no numbers, no logos, no watermark, centred composition, generous empty margin, " +
  "clean minimal modern SaaS product illustration.";

const ILLUSTRATIONS: { slug: string; prompt: string }[] = [
  {
    slug: "empty-history",
    prompt: `An empty stack of three floating rounded document cards, slightly fanned apart, one gently glowing. ${STYLE}`,
  },
  {
    slug: "empty-favorites",
    prompt: `A single rounded star resting inside an open bookmark pocket, floating slightly above a soft shadow. ${STYLE}`,
  },
  {
    slug: "empty-referrals",
    prompt: `Two rounded abstract figures connected by a soft looping ribbon, with a small gift box floating beside them. ${STYLE}`,
  },
  {
    slug: "empty-result",
    prompt: `A rounded blank picture frame or card floating gently, with a small magic wand and a few sparkles hovering above it as if about to fill it in. ${STYLE}`,
  },
  {
    slug: "not-found",
    prompt: `A rounded magnifying glass hovering over an open folder with a small floating question mark beside it, as if searching for something missing. ${STYLE}`,
  },
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const provider = getImageProvider();
  if (!provider.isConfigured()) throw new Error("image provider not configured");

  const only = process.argv.slice(2);
  for (const { slug, prompt } of ILLUSTRATIONS) {
    if (only.length && !only.includes(slug)) continue;
    const dest = `${OUT}/${slug}.png`;
    if (existsSync(dest)) {
      console.log(`skip   ${slug}`);
      continue;
    }
    console.log(`gen    ${slug}`);
    const result = await provider.generate({
      prompt,
      size: { width: 1024, height: 1024 },
      background: "transparent",
    });
    writeFileSync(dest, result.bytes);
    console.log(`  wrote ${dest} (${(result.bytes.length / 1024).toFixed(0)} KB)`);
  }
}

main().catch((e) => {
  console.error("FAILED:", e?.message ?? e);
  process.exit(1);
});
