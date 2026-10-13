import PptxGenJS from "pptxgenjs";
import type { Outline } from "../artifacts/types.js";

type PptxSlideLike = any;
const PptxCtor: any = PptxGenJS as any;
const shapes = { line: "line", ellipse: "ellipse", roundRect: "roundRect" } as const;

const navy = "172B4D";
const ink = "233047";
const muted = "64748B";
const ivory = "F8F5EF";
const gold = "C79A54";
const pale = "E8EEF5";

function addHeader(slide: PptxSlideLike, item: Outline["slides"][number]): void {
  slide.addText(item.kicker, { x: 0.72, y: 0.48, w: 3.5, h: 0.22, fontFace: "Aptos", fontSize: 8.5, bold: true, charSpacing: 1.8, color: gold, margin: 0 });
  slide.addText(item.title, { x: 0.72, y: 0.8, w: 11.7, h: 0.52, fontFace: "Aptos Display", fontSize: 25, bold: true, color: navy, margin: 0, breakLine: false, fit: "shrink" });
  slide.addText(item.takeaway, { x: 0.72, y: 1.46, w: 10.9, h: 0.4, fontFace: "Aptos", fontSize: 12.5, color: muted, margin: 0, fit: "shrink" });
  slide.addText(String(item.number).padStart(2, "0"), { x: 12.35, y: 0.52, w: 0.45, h: 0.25, fontFace: "Aptos", fontSize: 9, bold: true, color: navy, align: "right", margin: 0 });
  slide.addShape(shapes.line, { x: 0.72, y: 2.03, w: 11.85, h: 0, line: { color: "D7DDE5", width: 0.75 } });
}

function addBullets(slide: PptxSlideLike, bullets: string[], x = 0.9, y = 2.6, w = 5.35): void {
  bullets.forEach((bullet, index) => {
    const yy = y + index * 0.7;
    slide.addShape(shapes.ellipse, { x, y: yy + 0.09, w: 0.12, h: 0.12, fill: { color: gold }, line: { color: gold } });
    slide.addText(bullet, { x: x + 0.28, y: yy, w, h: 0.42, fontFace: "Aptos", fontSize: 15, color: ink, margin: 0, breakLine: false, fit: "shrink" });
  });
}

function addVisual(slide: PptxSlideLike, item: Outline["slides"][number]): void {
  const x = 7.05; const y = 2.53; const w = 5.35; const h = 3.95;
  slide.addShape(shapes.roundRect, { x, y, w, h, rectRadius: 0.06, fill: { color: "FFFFFF", transparency: 8 }, line: { color: "DCE3EC", width: 1 } });
  if (item.visual === "metric" || item.visual === "case") {
    ["获客效率", "学习完成", "复购动力"].forEach((label, i) => {
      const xx = x + 0.45 + i * 1.58;
      slide.addShape(shapes.roundRect, { x: xx, y: y + 0.58, w: 1.24, h: 1.18, rectRadius: 0.04, fill: { color: i === 1 ? pale : ivory }, line: { color: "FFFFFF", transparency: 100 } });
      slide.addText(["↓ 25%", "↑ 18%", "↑ 12%"][i], { x: xx + 0.08, y: y + 0.78, w: 1.08, h: 0.3, fontSize: 17, bold: true, color: navy, align: "center", margin: 0 });
      slide.addText(label, { x: xx + 0.08, y: y + 1.2, w: 1.08, h: 0.2, fontSize: 8.5, color: muted, align: "center", margin: 0 });
    });
    slide.addShape(shapes.line, { x: x + 0.56, y: y + 3.05, w: 4.25, h: -0.92, line: { color: gold, width: 2.25, beginArrowType: "none", endArrowType: "triangle" } });
    slide.addText("示意指标｜以首批项目数据校准", { x: x + 0.48, y: y + 3.38, w: 4.4, h: 0.2, fontSize: 9, color: muted, margin: 0 });
  } else if (item.visual === "architecture") {
    ["内容资产", "业务服务", "数据与智能"].forEach((label, i) => {
      const yy = y + 0.55 + i * 0.82;
      slide.addShape(shapes.roundRect, { x: x + 0.62, y: yy, w: 4.08, h: 0.5, rectRadius: 0.03, fill: { color: i === 1 ? navy : pale }, line: { color: i === 1 ? navy : "C8D4E2", width: 0.8 } });
      slide.addText(label, { x: x + 0.82, y: yy + 0.13, w: 3.7, h: 0.2, fontSize: 12, bold: true, color: i === 1 ? "FFFFFF" : navy, margin: 0 });
    });
  } else if (item.visual === "timeline") {
    slide.addShape(shapes.line, { x: x + 0.65, y: y + 2.1, w: 4.12, h: 0, line: { color: gold, width: 2.5, beginArrowType: "none", endArrowType: "triangle" } });
    ["共识", "闭环", "优化"].forEach((label, i) => {
      const xx = x + 0.58 + i * 1.75;
      slide.addShape(shapes.ellipse, { x: xx, y: y + 1.92, w: 0.36, h: 0.36, fill: { color: navy }, line: { color: "FFFFFF", width: 1 } });
      slide.addText(label, { x: xx - 0.25, y: y + 2.52, w: 0.85, h: 0.22, fontSize: 11, bold: true, color: navy, align: "center", margin: 0 });
      slide.addText(["第 1 周", "第 2 周", "持续迭代"][i], { x: xx - 0.32, y: y + 2.85, w: 1, h: 0.18, fontSize: 8.5, color: muted, align: "center", margin: 0 });
    });
  } else {
    const nodes = item.visual === "flow" ? ["需求", "内容", "转化", "学习", "复购"] : ["触达", "理解", "行动", "反馈"];
    nodes.forEach((label, i) => {
      const xx = x + 0.33 + i * (4.62 / Math.max(1, nodes.length - 1));
      slide.addShape(shapes.ellipse, { x: xx, y: y + 1.55, w: 0.62, h: 0.62, fill: { color: i % 2 ? pale : navy }, line: { color: i % 2 ? "C8D4E2" : navy } });
      slide.addText(label, { x: xx - 0.2, y: y + 2.38, w: 1.02, h: 0.22, fontSize: 9.5, bold: true, color: ink, align: "center", margin: 0 });
      if (i < nodes.length - 1) slide.addShape(shapes.line, { x: xx + 0.65, y: y + 1.86, w: (4.62 / Math.max(1, nodes.length - 1)) - 0.72, h: 0, line: { color: gold, width: 1.5, endArrowType: "triangle" } });
    });
    slide.addText(item.visual === "journey" ? "关键触点与角色分工" : "业务事件与数据回流", { x: x + 0.5, y: y + 3.28, w: 4.3, h: 0.25, fontSize: 10, color: muted, align: "center", margin: 0 });
  }
}

export async function buildPptx(outline: Outline, fileName = "proposal-ppt.pptx"): Promise<Buffer> {
  const pptx = new PptxCtor();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Proposal PPT";
  pptx.subject = outline.title;
  pptx.title = outline.title;
  pptx.company = "Proposal PPT";
  pptx.lang = "zh-CN";
  pptx.theme = { headFontFace: "Aptos Display", bodyFontFace: "Aptos", lang: "zh-CN" };
  for (const item of outline.slides) {
    const slide = pptx.addSlide();
    slide.background = { color: ivory };
    addHeader(slide, item);
    addBullets(slide, item.bullets);
    addVisual(slide, item);
    slide.addText("PROPOSAL PPT  /  CONFIDENTIAL", { x: 0.72, y: 7.08, w: 4, h: 0.16, fontSize: 7.5, charSpacing: 1.2, color: muted, margin: 0 });
    slide.addShape(shapes.line, { x: 0.72, y: 6.86, w: 11.85, h: 0, line: { color: "D7DDE5", width: 0.5 } });
  }
  return Buffer.from(await pptx.write({ outputType: "nodebuffer", fileName }));
}

