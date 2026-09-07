/**
 * Generates the real sample outputs shipped in public/samples.
 *
 * Deliberately runs each tool's OWN prompt builder and OWN image provider, so
 * what lands on disk is what a user actually gets — not a prettier mock-up.
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { getEnabledTools } from "../config/tools";
import { buildUserPrompt } from "../lib/ai/prompts";
import { getImageProvider } from "../lib/ai/image-client";

const OUT = path.resolve(process.cwd(), "public/samples");

async function main() {

  mkdirSync(OUT, { recursive: true });
  const provider = getImageProvider();
  if (!provider.isConfigured()) throw new Error("image provider not configured");

  const tools = getEnabledTools().filter((t) => t.outputType === "image");
  const only = process.argv.slice(2);

  for (const tool of tools) {
    if (only.length && !only.includes(tool.slug)) continue;
    const spec = tool.imageOutput!;
    const dest = `${OUT}/${tool.slug}.png`;
    if (existsSync(dest)) {
      console.log(`skip   ${tool.slug} (already generated)`);
      continue;
    }

    // The inputs a user sees pre-filled: placeholder for text, default for
    // selects. Same values the tool card already advertises as its example.
    const normalized: Record<string, string> = {};
    for (const f of tool.fields) {
      if (f.type === "image") continue;
      normalized[f.name] = f.defaultValue ?? f.placeholder ?? "";
    }

    const size =
      (spec.sizeField && spec.sizes?.[normalized[spec.sizeField]]) ||
      spec.defaultSize;
    const background =
      (spec.backgroundField &&
        spec.backgroundValues?.[normalized[spec.backgroundField]]) ||
      spec.background;

    // Edit-based tools need a source photo; generate one first and keep it as
    // the honest "before" half of the pair.
    let inputImage: { bytes: Buffer; mimeType: string } | undefined;
    if (spec.inputImageField) {
      const beforePath = `${OUT}/${tool.slug}-before.png`;
      if (!existsSync(beforePath)) {
        console.log(`gen    ${tool.slug}-before (source photo)`);
        const src = await provider.generate({
          prompt:
            "A candid smartphone photo of a single ceramic coffee mug on a cluttered kitchen counter, with crumbs, a dish cloth and a power socket visible behind it. Everyday lighting, slightly untidy, realistic.",
          size: { width: 1024, height: 1024 },
        });
        writeFileSync(beforePath, src.bytes);
      }
      const { readFileSync } = await import("node:fs");
      inputImage = { bytes: readFileSync(beforePath), mimeType: "image/png" };
    }

    console.log(`gen    ${tool.slug} (${size.width}x${size.height})`);
    const result = await provider.generate({
      prompt: buildUserPrompt(tool, normalized),
      size,
      inputImage,
      background,
    });
    writeFileSync(dest, result.bytes);
    console.log(`  wrote ${dest} (${(result.bytes.length / 1024).toFixed(0)} KB)`);
  }
}

main().catch((e) => {
  console.error("FAILED:", e?.message ?? e);
  process.exit(1);
});
