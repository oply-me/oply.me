import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OpenAIImageProvider } from "@/lib/ai/providers/openai-images";
import { MockImageProvider } from "@/lib/ai/providers/mock-image";
import { ImageProviderError } from "@/lib/ai/providers/image-types";
import { fitToExactDimensions } from "@/lib/images/resize";
import sharp from "sharp";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("OpenAIImageProvider", () => {
  const originalKey = process.env.OPENAI_API_KEY;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = "sk-test-key";
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalKey;
    vi.unstubAllGlobals();
  });

  it("reports unconfigured without an API key", () => {
    delete process.env.OPENAI_API_KEY;
    const provider = new OpenAIImageProvider();
    expect(provider.isConfigured()).toBe(false);
  });

  it("throws before calling fetch when the key is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const provider = new OpenAIImageProvider();
    await expect(
      provider.generate({ prompt: "a logo", size: { width: 1024, height: 1024 } }),
    ).rejects.toThrow(ImageProviderError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls the generations endpoint with a square native size for a square request", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [{ b64_json: Buffer.from("x").toString("base64") }] }));

    const provider = new OpenAIImageProvider();
    await provider.generate({ prompt: "a minimalist logo", size: { width: 1024, height: 1024 } });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/images/generations");
    const body = JSON.parse(init.body as string);
    expect(body.size).toBe("1024x1024");
    expect(body.prompt).toBe("a minimalist logo");
  });

  it("picks the landscape native size for a wide request (e.g. a YouTube thumbnail)", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [{ b64_json: Buffer.from("x").toString("base64") }] }));
    const provider = new OpenAIImageProvider();
    const result = await provider.generate({ prompt: "thumbnail", size: { width: 1280, height: 720 } });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.size).toBe("1536x1024");
    expect(result.width).toBe(1536);
    expect(result.height).toBe(1024);
  });

  it("picks the portrait native size for a tall request (e.g. a Story graphic)", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [{ b64_json: Buffer.from("x").toString("base64") }] }));
    const provider = new OpenAIImageProvider();
    await provider.generate({ prompt: "story graphic", size: { width: 1080, height: 1920 } });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.size).toBe("1024x1536");
  });

  it("calls the edits endpoint with multipart form data when an input image is supplied", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [{ b64_json: Buffer.from("x").toString("base64") }] }));
    const provider = new OpenAIImageProvider();
    await provider.generate({
      prompt: "remove the background",
      size: { width: 1024, height: 1024 },
      inputImage: { bytes: Buffer.from([1, 2, 3]), mimeType: "image/png" },
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/images/edits");
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("model")).toBeTruthy();
  });

  it("maps a 429 to a retryable error", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: { message: "rate limited" } }, 429));
    const provider = new OpenAIImageProvider();
    await expect(
      provider.generate({ prompt: "x", size: { width: 1024, height: 1024 } }),
    ).rejects.toMatchObject({ retryable: true });
  });

  it("maps a 401 to a non-retryable configuration error", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: { message: "invalid api key" } }, 401));
    const provider = new OpenAIImageProvider();
    await expect(
      provider.generate({ prompt: "x", size: { width: 1024, height: 1024 } }),
    ).rejects.toMatchObject({ retryable: false });
  });

  it("surfaces a content-policy refusal as a non-retryable, user-facing message", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { message: "Your request was rejected.", code: "content_policy_violation" } }, 400),
    );
    const provider = new OpenAIImageProvider();
    await expect(
      provider.generate({ prompt: "x", size: { width: 1024, height: 1024 } }),
    ).rejects.toMatchObject({ retryable: false, message: "Your request was rejected." });
  });

  it("maps a 500 to a retryable error", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: { message: "oops" } }, 500));
    const provider = new OpenAIImageProvider();
    await expect(
      provider.generate({ prompt: "x", size: { width: 1024, height: 1024 } }),
    ).rejects.toMatchObject({ retryable: true });
  });

  it("wraps a network failure as a retryable error", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    const provider = new OpenAIImageProvider();
    await expect(
      provider.generate({ prompt: "x", size: { width: 1024, height: 1024 } }),
    ).rejects.toMatchObject({ retryable: true });
  });
});

describe("MockImageProvider", () => {
  const originalFlag = process.env.MOCK_IMAGE_PROVIDER_FAIL;

  afterEach(() => {
    if (originalFlag === undefined) delete process.env.MOCK_IMAGE_PROVIDER_FAIL;
    else process.env.MOCK_IMAGE_PROVIDER_FAIL = originalFlag;
  });

  it("returns real image bytes at the requested dimensions", async () => {
    const provider = new MockImageProvider();
    const result = await provider.generate({
      prompt: "anything",
      size: { width: 200, height: 100 },
    });
    expect(result.width).toBe(200);
    expect(result.height).toBe(100);
    const meta = await sharp(result.bytes).metadata();
    expect(meta.width).toBe(200);
    expect(meta.height).toBe(100);
  });

  it("fails on demand, for testing the refund path", async () => {
    process.env.MOCK_IMAGE_PROVIDER_FAIL = "1";
    const provider = new MockImageProvider();
    await expect(
      provider.generate({ prompt: "x", size: { width: 100, height: 100 } }),
    ).rejects.toMatchObject({ retryable: true });
  });
});

describe("getImageProvider factory", () => {
  const originalProvider = process.env.AI_IMAGE_PROVIDER;

  afterEach(() => {
    if (originalProvider === undefined) delete process.env.AI_IMAGE_PROVIDER;
    else process.env.AI_IMAGE_PROVIDER = originalProvider;
    vi.resetModules();
  });

  it("throws a clear error for an unknown provider name", async () => {
    vi.resetModules();
    process.env.AI_IMAGE_PROVIDER = "not-a-real-provider";
    const { getImageProvider: freshGetImageProvider } = await import("@/lib/ai/image-client");
    expect(() => freshGetImageProvider()).toThrow(/Unknown AI_IMAGE_PROVIDER/);
  });

  it("selects the mock provider when configured", async () => {
    vi.resetModules();
    process.env.AI_IMAGE_PROVIDER = "mock";
    const { getImageProvider: freshGetImageProvider } = await import("@/lib/ai/image-client");
    expect(freshGetImageProvider().name).toBe("mock");
  });
});

describe("fitToExactDimensions", () => {
  it("produces an image at exactly the target pixel size regardless of the source aspect ratio", async () => {
    const source = await sharp({
      create: { width: 1536, height: 1024, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
      .png()
      .toBuffer();

    const fitted = await fitToExactDimensions(source, { width: 1280, height: 720 });
    const meta = await sharp(fitted).metadata();
    expect(meta.width).toBe(1280);
    expect(meta.height).toBe(720);
  });
});
