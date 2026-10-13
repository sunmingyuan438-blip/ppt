import JSZip from "jszip";
import * as XLSX from "xlsx";
import type { InputFile, MaterialBlock, MaterialDocument } from "./material-types.js";

function textBlocks(text: string): MaterialBlock[] {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => ({ type: /^#{1,6}\s/.test(line) ? "heading" : /^[-*•]\s/.test(line) ? "list" : "paragraph", text: line.replace(/^#{1,6}\s+|^[-*•]\s+/, "") }));
}

async function parseDocx(body: Uint8Array): Promise<MaterialBlock[]> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer: Buffer.from(body) });
  return textBlocks(result.value);
}

async function parsePdf(body: Uint8Array): Promise<MaterialBlock[]> {
  const module = await import("pdf-parse");
  const parser = (module as unknown as { default?: (input: Buffer) => Promise<{ text: string }> }).default ?? (module as unknown as (input: Buffer) => Promise<{ text: string }>);
  const result = await parser(Buffer.from(body));
  return textBlocks(result.text);
}

function parseXlsx(body: Uint8Array): MaterialBlock[] {
  const workbook = XLSX.read(body, { type: "buffer", cellDates: true });
  return workbook.SheetNames.flatMap((sheet) => {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheet], { header: 1, raw: false });
    return rows.filter((row) => row.some((cell) => String(cell ?? "").trim())).map((row) => ({ type: "table" as const, text: row.map((cell) => String(cell ?? "").trim()).join(" | "), location: { sheet } }));
  });
}

async function parsePptx(body: Uint8Array): Promise<MaterialBlock[]> {
  const zip = await JSZip.loadAsync(body);
  const slideNames = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name)).sort();
  const blocks: MaterialBlock[] = [];
  for (const name of slideNames) {
    const xml = await zip.files[name].async("text");
    const text = [...xml.matchAll(/<a:t>(.*?)<\/a:t>/g)].map((match) => match[1]).join(" ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").trim();
    if (text) blocks.push({ type: "paragraph", text, location: { slide: Number(name.match(/slide(\d+)/)?.[1] ?? 0) } });
  }
  return blocks;
}

export async function extractMaterial(file: InputFile): Promise<MaterialDocument> {
  const normalized = file.contentType.toLowerCase();
  let blocks: MaterialBlock[];
  if (normalized.includes("text/") || /\.(txt|md)$/i.test(file.fileName)) blocks = textBlocks(Buffer.from(file.body).toString("utf8"));
  else if (normalized.includes("word") || /\.docx$/i.test(file.fileName)) blocks = await parseDocx(file.body);
  else if (normalized.includes("pdf") || /\.pdf$/i.test(file.fileName)) blocks = await parsePdf(file.body);
  else if (normalized.includes("spreadsheet") || normalized.includes("excel") || /\.(xlsx|xls)$/i.test(file.fileName)) blocks = parseXlsx(file.body);
  else if (normalized.includes("presentation") || /\.pptx$/i.test(file.fileName)) blocks = await parsePptx(file.body);
  else throw new Error(`unsupported_file_type:${file.contentType}`);
  return { fileName: file.fileName, contentType: file.contentType, blocks, sourceFileId: file.sourceFileId };
}
