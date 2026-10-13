import { createHash } from "node:crypto";
import type { ResearchSource } from "../artifacts/types.js";

function safeUrl(value: string): URL | null {
  try {
    const url = new URL(value.trim());
    if (!/^https?:$/.test(url.protocol) || /^(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)$/i.test(url.hostname)) return null;
    return url;
  } catch { return null; }
}

function cleanText(value: string): string { return value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim(); }

function sourceId(url: string): string { return createHash("sha1").update(url).digest("hex").slice(0, 12); }

export async function inspectReferenceUrls(raw: string, fetchImpl: typeof fetch = fetch): Promise<ResearchSource[]> {
  const urls = [...new Set(raw.split(/[\s,，\n]+/).map(safeUrl).filter((url): url is URL => Boolean(url)).map((url) => url.toString()))].slice(0, 5);
  const sources: ResearchSource[] = [];
  for (const url of urls) {
    const id = sourceId(url); const observedAt = new Date().toISOString();
    try {
      const response = await fetchImpl(url, { headers: { Accept: "text/html,application/xhtml+xml,text/plain;q=0.8" }, redirect: "follow", signal: AbortSignal.timeout(8_000) });
      const html = (await response.text()).slice(0, 200_000);
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = cleanText(titleMatch?.[1] ?? url).slice(0, 160) || url;
      const summary = cleanText(html).slice(0, 280) || "页面未提供可提取的摘要，请人工查看原文。";
      sources.push({ id, url, title, summary, status: response.ok ? "confirmed" : "needs_review", observedAt });
    } catch { sources.push({ id, url, title: url, summary: "抓取失败，请在确认区人工打开并核验。", status: "failed", observedAt }); }
  }
  return sources;
}

