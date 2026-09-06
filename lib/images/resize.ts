import "server-only";

import sharp from "sharp";

/**
 * Fits image bytes to an exact pixel size. The image providers only return a
 * few coarse native sizes (see lib/ai/providers/openai-images.ts's
 * nativeSizeFor), so this is what makes a tool's declared real-world
 * dimensions (e.g. 1280x720 for a YouTube thumbnail) actually true of the
 * file the user downloads, regardless of what the model natively produced.
 */
export async function fitToExactDimensions(
  bytes: Buffer,
  target: { width: number; height: number },
): Promise<Buffer> {
  return sharp(bytes)
    .resize(target.width, target.height, { fit: "cover", position: "attention" })
    .png()
    .toBuffer();
}
