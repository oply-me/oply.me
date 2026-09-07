/**
 * Turns the generated PNGs into web-weight WebP.
 *
 * gpt-image-1 returns 1–2 MB PNGs at native size. Shipping those would undo
 * the LCP work — these are decoration, so they get resized to roughly twice
 * their display size and re-encoded. WebP keeps the alpha the cutouts and
 * illustrations rely on.
 */
import { readdirSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const TARGETS = [
  { dir: "public/samples", width: 900, quality: 78 },
  { dir: "public/illustrations", width: 420, quality: 82 },
];

async function main() {
  for (const { dir, width, quality } of TARGETS) {
    const abs = path.resolve(process.cwd(), dir);
    for (const file of readdirSync(abs).filter((f) => f.endsWith(".png"))) {
      const from = path.join(abs, file);
      const to = from.replace(/\.png$/, ".webp");
      const before = statSync(from).size;

      await sharp(from)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality, alphaQuality: 90 })
        .toFile(to);

      const after = statSync(to).size;
      console.log(
        `${file.padEnd(38)} ${(before / 1024).toFixed(0).padStart(5)} KB -> ${(after / 1024).toFixed(0).padStart(4)} KB webp`,
      );
      unlinkSync(from);
    }
  }
}

main().catch((e) => {
  console.error("FAILED:", e?.message ?? e);
  process.exit(1);
});
