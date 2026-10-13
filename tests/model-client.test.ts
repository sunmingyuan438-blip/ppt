import { afterEach, describe, expect, it, vi } from "vitest";
import { loadConfig } from "../config/config.js";
import { invokeChat } from "../server/ai/model-client.js";
import { parseOutline } from "../server/ai/output-validation.js";

const config = { ...loadConfig({ APP_ENV: "fixture" }), APP_ENV: "production" as const };
const messages = [{ role: "user" as const, content: "整理方案" }];
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });
function mockPlatform(result: unknown, status = 200) {
  return vi.fn<typeof fetch>().mockResolvedValueOnce(json({ items: [{ model_key: config.AIGZM_MODEL_KEY, model_category: "chat" }] })).mockResolvedValueOnce(json(result, status));
}

describe("real model gateway contract", () => {
  afterEach(() => vi.restoreAllMocks());
  it("checks the live catalog and invokes with the OAuth token and stable request key", async () => {
    const fetchImpl = mockPlatform({ status: "success", request_id: "r1", output: { choices: [{ finish_reason: "stop", message: { content: "方案正文" } }] } });
    expect(await invokeChat(config, "test-user-token", messages, { fetchImpl, idempotencyKey: "business-1" })).toEqual({ content: "方案正文", requestId: "r1" });
    const [, init] = fetchImpl.mock.calls[1];
    expect(init?.headers).toEqual({ Authorization: "Bearer test-user-token", "Content-Type": "application/json" });
    expect(JSON.parse(init!.body as string)).toEqual({ input: { messages }, idempotency_key: "business-1" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
  it("maps insufficient balance without leaking the raw upstream body or retrying", async () => {
    const fetchImpl = mockPlatform({ error: "insufficient_balance", message: "private upstream text" }, 402);
    await expect(invokeChat(config, "test-user-token", messages, { fetchImpl })).rejects.toMatchObject({ code: "ai_insufficient_balance", statusCode: 402 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
  it.each([
    [{ status: "provider_unknown", request_id: "pending-1" }, "ai_result_pending"],
    [{ status: "failed" }, "ai_generation_failed"],
    [{ status: "success", output: { choices: [{ finish_reason: "length", message: { content: "partial" } }] } }, "ai_output_incomplete"],
    [{ status: "success", output: { choices: [{ message: { content: "" } }] } }, "ai_empty_output"],
  ])("rejects unusable gateway results %#", async (result, code) => {
    await expect(invokeChat(config, "test-user-token", messages, { fetchImpl: mockPlatform(result) })).rejects.toMatchObject({ code });
  });
  it("never sends a fixture token to the platform", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(invokeChat(config, "fixture-access-token", messages, { fetchImpl })).rejects.toMatchObject({ code: "ai_authorization_required" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it("uses only the developer Key on the developer endpoint", async () => {
    const fetchImpl = mockPlatform({ status: "success", request_id: "d1", output: { choices: [{ message: { content: "真实模型输出" } }] } });
    await invokeChat({ ...config, APP_ENV: "developer", AIGZM_API_KEY: "unit-test-key" }, "local-workspace-session", messages, { fetchImpl, idempotencyKey: "developer-request" });
    const [url, init] = fetchImpl.mock.calls[1];
    expect(url).toBe(`https://aigzm.com/v1/developer/models/${config.AIGZM_MODEL_KEY}/invoke`);
    expect(init?.headers).toEqual({ "Content-Type": "application/json", "X-API-Key": "unit-test-key" });
    expect(init?.body).not.toContain("local-workspace-session");
    expect(init?.body).not.toContain("client_id");
  });
  it("does not fall back to OAuth when the developer Key is missing", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(invokeChat({ ...config, APP_ENV: "developer" }, "test-user-token", messages, { fetchImpl })).rejects.toMatchObject({ code: "ai_key_required", statusCode: 503 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it("explains pending Key activation without retrying", async () => {
    const fetchImpl = mockPlatform({ error: "api_key_delivery_pending" }, 409);
    await expect(invokeChat({ ...config, APP_ENV: "developer", AIGZM_API_KEY: "unit-test-key" }, "", messages, { fetchImpl })).rejects.toMatchObject({ code: "ai_key_pending", statusCode: 409 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
  it("validates slide shape and assigns unique sequential identities", () => {
    const slide = { title: "增长机会", kicker: "GROWTH", takeaway: "先验证转化", bullets: ["小范围试点"], visual: "flow" };
    const outline = parseOutline(JSON.stringify({ title: "方案", subtitle: "业务方案", slides: [{ ...slide, id: "duplicate", number: 9 }, { ...slide, id: "duplicate", number: 9 }] }));
    expect(outline.slides.map((item) => [item.id, item.number])).toEqual([["slide-01", 1], ["slide-02", 2]]);
    expect(() => parseOutline(JSON.stringify({ title: "方案", subtitle: "业务方案", slides: [{ ...slide, bullets: null }] }))).toThrow(/结构不完整/);
  });
});
