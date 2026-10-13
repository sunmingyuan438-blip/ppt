import { describe, expect, it } from "vitest";
import { buildApp } from "../server/index.js";
import JSZip from "jszip";

describe("brief, outline and export flow", () => {
  it("creates a redacted brief, generates an outline and exports an editable pptx", async () => {
    const { app } = buildApp();
    const login = await app.inject({ method: "GET", url: "/api/oauth/start" });
    const cookie = login.headers["set-cookie"];
    const created = await app.inject({ method: "POST", url: "/api/projects", headers: { cookie }, payload: { title: "知识付费增长方案" } });
    const projectId = created.json().project.id as string;
    const brief = await app.inject({ method: "POST", url: `/api/projects/${projectId}/brief`, headers: { cookie }, payload: { customerNeed: "客户：星河平台，希望提高课程转化，联系人：张三，预算 30 万，邮箱 sales@example.com", currentApproach: "销售和售前靠旧 PPT 拼接", deliverable: "12-15 页可编辑方案 PPT", painPoint: "获客成本高、交付依赖人工、复购不足", duration: "2 周" } });
    expect(brief.statusCode).toBe(200);
    expect(brief.json().brief.redactedText).not.toContain("sales@example.com");
    const outline = await app.inject({ method: "POST", url: `/api/projects/${projectId}/outline`, headers: { cookie } });
    expect(outline.statusCode).toBe(200);
    expect(outline.json().outline.slides).toHaveLength(14);
    const edited = await app.inject({ method: "PATCH", url: `/api/projects/${projectId}/outline/slides/slide-01`, headers: { cookie }, payload: { title: "管理层先看增长机会", takeaway: "先确认投资边界和验证路径。", bullets: ["增长机会", "投入边界", "验证路径"] } });
    expect(edited.statusCode).toBe(200);
    expect(edited.json().slide.title).toBe("管理层先看增长机会");
    const workspace = await app.inject({ method: "GET", url: `/api/projects/${projectId}/workspace`, headers: { cookie } });
    expect(workspace.json().artifacts.outline.slides[0].title).toBe("管理层先看增长机会");
    const invalid = await app.inject({ method: "PATCH", url: `/api/projects/${projectId}/outline/slides/slide-01`, headers: { cookie }, payload: { title: "   " } });
    expect(invalid.statusCode).toBe(400);
    const generated = await app.inject({ method: "POST", url: `/api/projects/${projectId}/generate`, headers: { cookie } });
    expect(generated.statusCode).toBe(200);
    const exported = await app.inject({ method: "GET", url: `/api/projects/${projectId}/export`, headers: { cookie } });
    expect(exported.statusCode).toBe(200);
    expect(exported.headers["content-type"]).toContain("presentationml.presentation");
    expect(exported.rawPayload.subarray(0, 2).toString()).toBe("PK");
    const zip = await JSZip.loadAsync(exported.rawPayload);
    const firstSlide = await zip.file("ppt/slides/slide1.xml")!.async("string");
    expect(firstSlide).toContain("管理层先看增长机会");
    expect(firstSlide).toContain("先确认投资边界和验证路径。");
    await app.close();
  });
});

