import { describe, expect, it } from "vitest";
import { inspectReferenceUrls } from "../server/research/web.js";

describe("reference research", () => {
  it("extracts a safe title and short summary without blocking invalid URLs", async () => {
    const sources = await inspectReferenceUrls("https://example.com\nhttp://localhost:3000/private\nnot-a-url", async () => new Response("<html><title>行业报告</title><body>公开市场内容与用户增长趋势</body></html>", { status: 200 }));
    expect(sources).toHaveLength(1);
    expect(sources[0].title).toBe("行业报告");
    expect(sources[0].summary).toContain("用户增长趋势");
    expect(sources[0].status).toBe("confirmed");
  });

  it("keeps a failed source visible for manual review", async () => {
    const sources = await inspectReferenceUrls("https://example.com", async () => { throw new Error("network down"); });
    expect(sources[0].status).toBe("failed");
    expect(sources[0].summary).toContain("人工打开");
  });
});

