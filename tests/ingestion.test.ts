import { describe, expect, it } from "vitest";
import { extractMaterial } from "../server/ingestion/file-parser.js";

describe("material ingestion", () => {
  it("extracts text headings and paragraphs", async () => {
    const result = await extractMaterial({ fileName: "brief.md", contentType: "text/markdown", body: Buffer.from("# 客户目标\n降低获客成本\n- 提升复购") });
    expect(result.blocks.map((block) => block.type)).toEqual(["heading", "paragraph", "list"]);
  });

  it("rejects unsupported formats", async () => {
    await expect(extractMaterial({ fileName: "brief.zip", contentType: "application/zip", body: new Uint8Array() })).rejects.toThrow("unsupported_file_type");
  });
});
