import { describe, expect, it } from "vitest";
import { getEnabledTools } from "@/config/tools";

const imageTools = getEnabledTools().filter((t) => t.outputType === "image");

describe("image tool configuration", () => {
  it("gives every image tool an imageOutput spec with a positive default size", () => {
    for (const tool of imageTools) {
      expect(tool.imageOutput, tool.slug).toBeDefined();
      expect(tool.imageOutput!.defaultSize.width, tool.slug).toBeGreaterThan(0);
      expect(tool.imageOutput!.defaultSize.height, tool.slug).toBeGreaterThan(0);
    }
  });

  it("keeps a size-select field's options in exact sync with imageOutput.sizes", () => {
    for (const tool of imageTools) {
      const spec = tool.imageOutput!;
      if (!spec.sizeField) continue;

      const field = tool.fields.find((f) => f.name === spec.sizeField);
      expect(field, `${tool.slug}: sizeField "${spec.sizeField}" does not exist`).toBeDefined();
      expect(field!.type, tool.slug).toBe("select");

      const optionValues = new Set(field!.options?.map((o) => o.value));
      const sizeKeys = new Set(Object.keys(spec.sizes ?? {}));

      for (const value of optionValues) {
        expect(sizeKeys.has(value), `${tool.slug}: option "${value}" has no matching size`).toBe(
          true,
        );
      }
      for (const key of sizeKeys) {
        expect(optionValues.has(key), `${tool.slug}: size "${key}" matches no option`).toBe(true);
      }
    }
  });

  it("points inputImageField at a real field of type \"image\"", () => {
    for (const tool of imageTools) {
      const spec = tool.imageOutput!;
      if (!spec.inputImageField) continue;

      const field = tool.fields.find((f) => f.name === spec.inputImageField);
      expect(field, `${tool.slug}: inputImageField "${spec.inputImageField}" does not exist`)
        .toBeDefined();
      expect(field!.type, tool.slug).toBe("image");
      expect(field!.required, tool.slug).toBe(true);
    }
  });

  it("declares a download action, since there is no copy-to-clipboard for an image", () => {
    for (const tool of imageTools) {
      expect(tool.extraActions ?? [], tool.slug).toContain("download");
    }
  });

  it("never declares shorten/expand/improve, which have no meaning for an image", () => {
    for (const tool of imageTools) {
      for (const action of ["shorten", "expand", "improve"] as const) {
        expect(tool.extraActions ?? [], tool.slug).not.toContain(action);
      }
    }
  });

  it("prices every image tool above the highest text-tool credit cost", () => {
    const textToolCeiling = Math.max(
      ...getEnabledTools()
        .filter((t) => t.outputType !== "image")
        .map((t) => t.creditCost),
    );
    for (const tool of imageTools) {
      expect(tool.creditCost, tool.slug).toBeGreaterThan(textToolCeiling);
    }
  });

  it("gives every \"image\" field no maxLength or options, since those do not apply", () => {
    for (const tool of imageTools) {
      for (const field of tool.fields) {
        if (field.type !== "image") continue;
        expect(field.maxLength, `${tool.slug}.${field.name}`).toBeUndefined();
        expect(field.options, `${tool.slug}.${field.name}`).toBeUndefined();
      }
    }
  });
});
