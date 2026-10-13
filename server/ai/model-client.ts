import { randomUUID } from "node:crypto";
import type { AppConfig } from "../../config/config.js";

export type ModelMessage = { role: "system" | "user" | "assistant"; content: string };
type ModelResponse = { content: string; requestId?: string };

export class ModelError extends Error {
  constructor(public code: string, message: string, public statusCode = 502, public requestId?: string) { super(message); }
}

function httpError(status: number, developerMode: boolean, code?: unknown): ModelError {
  if (developerMode && status === 409 && code === "api_key_delivery_pending") return new ModelError("ai_key_pending", "API Key 尚未激活，请在开发者中心确认密钥已保存。", 409);
  if (developerMode && status === 401) return new ModelError("ai_key_invalid", "开发者 API Key 无效或已停用，请检查后端配置。", 401);
  if (developerMode && status === 403) return new ModelError("ai_model_forbidden", "开发者账号暂时没有该模型的调用权限，请检查模型广场。", 403);
  if (status === 401) return new ModelError("ai_authorization_expired", "AI 授权已过期，请重新连接平台。", 401);
  if (status === 402) return new ModelError("ai_insufficient_balance", "平台积分不足，请充值后再生成。", 402);
  if (status === 403) return new ModelError("ai_access_denied", "当前授权不能调用模型，请确认正式应用状态和积分消费权限。", 403);
  if (status === 429) return new ModelError("ai_rate_limited", "AI 调用过于频繁，请稍后重试。", 429);
  if (status === 413) return new ModelError("ai_input_too_large", "资料过长，请精简后重新生成。", 413);
  return new ModelError("ai_service_unavailable", "AI 服务暂时不可用，请稍后再试。");
}

export async function invokeChat(config: AppConfig, accessToken: string, messages: ModelMessage[], options: { modelKey?: string; idempotencyKey?: string; maxTokens?: number; fetchImpl?: typeof fetch } = {}): Promise<ModelResponse> {
  if (config.APP_ENV === "fixture") return { content: "", requestId: "fixture" };
  const developerMode = config.APP_ENV === "developer";
  if (developerMode && !config.AIGZM_API_KEY?.trim()) throw new ModelError("ai_key_required", "请先在后端 .env 文件中填写 AIGZM_API_KEY，重启服务后即可生成。", 503);
  if (!developerMode && (!accessToken || accessToken === "fixture-access-token")) throw new ModelError("ai_authorization_required", "请先完成真实平台授权。", 401);
  const fetchImpl = options.fetchImpl ?? fetch;
  const modelKey = options.modelKey ?? config.AIGZM_MODEL_KEY;
  try {
    const catalogResponse = await fetchImpl(`${config.AIGZM_API_ORIGIN}/v1/platform/models`, { signal: AbortSignal.timeout(15_000) });
    if (!catalogResponse.ok) throw httpError(catalogResponse.status, developerMode);
    const catalog = await catalogResponse.json() as { items?: Array<{ model_key: string; model_category?: string; model_categories?: string[] }> };
    if (!catalog.items?.some((item) => item.model_key === modelKey && (item.model_category === "chat" || item.model_categories?.includes("chat")))) throw new ModelError("ai_model_unavailable", "配置的文本模型当前不可用，请更换模型后重试。", 503);
    const idempotencyKey = options.idempotencyKey ?? randomUUID();
    const input = { messages, ...(options.maxTokens ? { max_tokens: options.maxTokens } : {}) };
    if (Buffer.byteLength(JSON.stringify(input), "utf8") > 32_000) throw new ModelError("ai_input_too_large", "资料过长，请精简后重新生成。", 413);
    const endpoint = developerMode ? "/v1/developer/models" : "/v1/models";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (developerMode) headers["X-API-Key"] = config.AIGZM_API_KEY!.trim();
    else headers.Authorization = `Bearer ${accessToken}`;
    const response = await fetchImpl(`${config.AIGZM_API_ORIGIN}${endpoint}/${encodeURIComponent(modelKey)}/invoke`, {
      method: "POST",
      headers,
      body: JSON.stringify({ input, idempotency_key: idempotencyKey }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) { const errorBody = await response.json().catch(() => ({})) as { error?: unknown }; throw httpError(response.status, developerMode, errorBody.error); }
    const data = await response.json() as { status?: string; request_id?: string; output?: { choices?: Array<{ finish_reason?: string; message?: { content?: string } }> } };
    const requestId = response.headers.get("x-request-id") ?? data.request_id;
    if (data.status === "provider_unknown") throw new ModelError("ai_result_pending", "平台正在核对本次调用结果，请保留请求号，暂勿重复生成。", 503, requestId);
    if (data.status !== "success") throw new ModelError("ai_generation_failed", "AI 未能完成生成，请稍后再试。", 502, requestId);
    const choice = data.output?.choices?.[0];
    if (choice?.finish_reason === "length") throw new ModelError("ai_output_incomplete", "模型输出不完整，请简化需求后再试。", 502, requestId);
    const content = choice?.message?.content;
    if (typeof content !== "string" || !content.trim()) throw new ModelError("ai_empty_output", "AI 没有返回可用正文，请简化需求后再试。", 502, requestId);
    return { content, requestId };
  } catch (error) {
    if (error instanceof ModelError) throw error;
    throw new ModelError("ai_connection_failed", "AI 连接超时或中断，本次结果可能待核对，请暂勿重复生成。");
  }
}

