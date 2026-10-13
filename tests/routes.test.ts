import { describe, expect, it } from "vitest";
import { buildApp } from "../server/index.js";

describe("project routes", () => {
  it("creates and isolates a fixture project", async () => {
    const { app } = buildApp();
    const login = await app.inject({ method: "GET", url: "/api/oauth/start" });
    const cookie = login.headers["set-cookie"];
    expect(cookie).toContain("proposal_session=");
    const created = await app.inject({ method: "POST", url: "/api/projects", headers: { cookie }, payload: { title: "知识付费增长方案" } });
    expect(created.statusCode).toBe(201);
    const project = created.json().project;
    const listed = await app.inject({ method: "GET", url: "/api/projects", headers: { cookie } });
    expect(listed.statusCode).toBe(200);
    expect(listed.json().projects[0].id).toBe(project.id);
    const anonymous = await app.inject({ method: "GET", url: "/api/projects" });
    expect(anonymous.statusCode).toBe(401);
    await app.close();
  });

  it("parses and redacts an uploaded material into the project context", async () => {
    const { app } = buildApp();
    const login = await app.inject({ method: "GET", url: "/api/oauth/start" });
    const cookie = login.headers["set-cookie"];
    const created = await app.inject({ method: "POST", url: "/api/projects", headers: { cookie }, payload: { title: "上传资料测试" } });
    const projectId = created.json().project.id as string;
    const boundary = "----proposal-test-boundary";
    const payload = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="meeting.txt"\r\nContent-Type: text/plain\r\n\r\n客户：星河平台\n联系人：张三\n邮箱：sales@example.com\n预算 30 万\r\n--${boundary}--\r\n`);
    const uploaded = await app.inject({ method: "POST", url: `/api/projects/${projectId}/files`, headers: { cookie, "content-type": `multipart/form-data; boundary=${boundary}` }, payload });
    expect(uploaded.statusCode).toBe(201);
    expect(uploaded.json().material.parseStatus).toBe("parsed");
    const workspace = await app.inject({ method: "GET", url: `/api/projects/${projectId}/workspace`, headers: { cookie } });
    expect(workspace.json().artifacts.materials[0].excerpt).not.toContain("sales@example.com");
    await app.close();
  });
});
