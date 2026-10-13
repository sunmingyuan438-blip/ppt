import { z } from "zod";
import { ModelError } from "./model-client.js";

const text = z.string().trim().min(1).max(600);
const items = z.array(text).min(1).max(12);
export const briefSchema = z.object({ projectContext: text, businessGoal: text, audience: items, painPoints: items, successCriteria: items, constraints: z.array(text).max(12) });
export const outlineSchema = z.object({
  title: text, subtitle: text,
  slides: z.array(z.object({
    title: text, kicker: text, takeaway: text, bullets: z.array(text).min(1).max(5),
    visual: z.enum(["metric", "journey", "flow", "architecture", "timeline", "case", "table", "closing"]),
  })).min(1).max(20),
});

export function parseModelJson<T>(content: string, schema: z.ZodType<T>): T {
  try {
    const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    return schema.parse(JSON.parse(cleaned));
  } catch {
    throw new ModelError("ai_output_invalid", "AI 返回的结构不完整，本次内容未保存，请简化需求后再试。");
  }
}

export function parseOutline(content: string) {
  const parsed = parseModelJson(content, outlineSchema);
  return { ...parsed, slides: parsed.slides.map((slide, index) => ({ ...slide, id: `slide-${String(index + 1).padStart(2, "0")}`, number: index + 1 })), generatedAt: new Date().toISOString() };
}
