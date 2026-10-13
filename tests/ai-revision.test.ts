import { afterEach, expect, it, vi } from "vitest";
import { buildApp } from "../server/index.js";
import { createSession, serializeSessionCookie } from "../server/auth/session.js";
import { fixtureOutline } from "../server/ai/fixture-generators.js";

afterEach(() => vi.unstubAllGlobals());

it("uses AI for arbitrary revision instructions and preserves the outline if a response is invalid", async () => {
  const { app, config, artifacts } = buildApp();
  const session = createSession({ issuer: "unit-test", subject: "revision-user" }, { access_token: "test-token", token_type: "Bearer" });
  const cookie = serializeSessionCookie(session.id, false);
  const created = await app.inject({ method: "POST", url: "/api/projects", headers: { cookie }, payload: { title: "试点方案" } });
  const projectId = created.json().project.id;
  await artifacts.saveOutline("unit-test|revision-user", projectId, fixtureOutline());
  config.APP_ENV = "production";
  const revised = fixtureOutline();
  revised.slides[0].title = "先验证社群交付";
  const result = (value: unknown) => new Response(JSON.stringify(value), { headers: { "Content-Type": "application/json" } });
  const fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetchMock);
  const enqueue = (output: unknown) => {
    fetchMock.mockResolvedValueOnce(result({ items: [{ model_key: config.AIGZM_MODEL_KEY, model_category: "chat" }] }));
    fetchMock.mockResolvedValueOnce(result({ status: "success", request_id: "revision-1", output: { choices: [{ finish_reason: "stop", message: { content: JSON.stringify(output) } }] } }));
  };
  try {
    enqueue(revised);
    const response = await app.inject({ method: "POST", url: `/api/projects/${projectId}/chat`, headers: { cookie }, payload: { message: "突出社群交付，联系人邮箱 private@example.com" } });
    expect(response.statusCode).toBe(200);
    expect(response.json().outline.slides[0].title).toBe("先验证社群交付");
    const invokeBody = fetchMock.mock.calls[1][1]!.body as string;
    expect(invokeBody).toContain("突出社群交付");
    expect(invokeBody).not.toContain("private@example.com");
    enqueue({ title: "broken", slides: null });
    const invalid = await app.inject({ method: "POST", url: `/api/projects/${projectId}/chat`, headers: { cookie }, payload: { message: "调整实施阶段" } });
    expect(invalid.statusCode).toBe(502);
    expect(invalid.json().error).toBe("ai_output_invalid");
    const saved = await artifacts.get("unit-test|revision-user", projectId);
    expect(saved.outline?.slides[0].title).toBe("先验证社群交付");
  } finally { await app.close(); }
});
