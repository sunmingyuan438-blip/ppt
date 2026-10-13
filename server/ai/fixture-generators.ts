import type { BriefInput, BriefSummary, MaterialSummary, Outline, ResearchSource } from "../artifacts/types.js";
import { redactText } from "../privacy/redactor.js";

export function fixtureBrief(input: BriefInput, materials: MaterialSummary[] = [], sources: ResearchSource[] = []): BriefSummary {
  const joined = [input.customerNeed, input.currentApproach, input.deliverable, input.painPoint, input.duration, ...materials.map((material) => material.excerpt)].filter(Boolean).join("\n");
  const spans: Parameters<typeof redactText>[2] = [];
  const redactedText = redactText(joined, undefined, spans);
  const labels: Record<string, string> = { customer: "客户名称", contact: "联系人", phone: "手机号", email: "邮箱", amount: "金额", id: "账号", project_code: "项目编号" };
  const customerType = /职业教育|培训|课程|知识付费/.test(joined) ? "知识付费与内容服务机构" : "企业客户";
  return {
    projectContext: `${customerType}希望将分散的内容、获客、转化与交付动作串成可复制的增长闭环${materials.length ? `，并已参考 ${materials.length} 份项目资料。` : "。"}`,
    businessGoal: "在保证内容质量与交付体验的前提下，降低获客和交付成本，提升购买转化、学习完成与复购。",
    audience: ["管理层：关心增长效率与投入产出", "业务团队：关心内容生产、转化与交付流程", "技术与交付：关心系统边界、数据闭环和落地难度"],
    painPoints: ["需求分散，方案主线依赖人工反复整理", "课程同质化与交付依赖人工，难以规模化", "获客、学习、社群和复购数据没有形成统一闭环"],
    successCriteria: ["首次沟通后快速形成可汇报的一版方案", "客户只需少量修改即可确认业务范围和实施路径", "每个方案结论都有可追溯的输入、来源或假设"],
    constraints: [input.duration || "交付周期待确认", "输出需保持品牌可编辑性", "客户原始信息在进入模型前先脱敏"],
    redactedText,
    notices: [...new Set(spans.map((span) => span.kind))].map((kind) => ({ kind, count: spans.filter((span) => span.kind === kind).length, label: labels[kind] ?? kind })),
    sources,
    generatedAt: new Date().toISOString(),
  };
}

export function fixtureOutline(): Outline {
  const rows: Array<[string, string, string, string, string[], Outline["slides"][number]["visual"]]> = [
    ["01", "从需求碎片到增长闭环", "EXECUTIVE STORY", "用一条可落地的业务主线，把内容、获客、交付与复购连接起来。", ["围绕增长效率建立共同语言", "先确认业务假设，再展开产品模块", "用阶段性交付降低决策成本"], "metric"],
    ["02", "客户目标与决策背景", "WHY NOW", "客户需要在增长放缓时，同时提升转化效率和交付规模。", ["降低获客成本与人工交付依赖", "提升用户学习完成与复购", "让管理层、业务、技术看到同一张图"], "journey"],
    ["03", "行业变化：内容供给正在商品化", "MARKET SIGNALS", "竞争焦点从“有没有内容”转向“能否持续交付结果”。", ["内容生产速度成为基础能力", "服务体验决定口碑与复购", "数据闭环支撑精细化运营"], "metric"],
    ["04", "当前业务的三个瓶颈", "DIAGNOSIS", "获客、交付与复购之间缺少同一套经营指标。", ["需求与内容资产分散", "转化动作依赖个人经验", "学习行为无法反哺下一次运营"], "table"],
    ["05", "目标用户与关键场景", "USER MOMENTS", "不同角色在同一个项目中，需要不同的决策信息。", ["管理层：看增长与投入产出", "运营：看内容、活动与用户分层", "交付：看过程、风险与服务质量"], "journey"],
    ["06", "方案总览：一条可运营的闭环", "SOLUTION", "用内容中台、增长运营和学习服务三层能力承接业务目标。", ["内容资产层：生产、审核、上架", "增长运营层：获客、转化、社群", "学习服务层：交付、数据、复购"], "flow"],
    ["07", "内容生产与课程交付", "CONTENT ENGINE", "把一次性项目沉淀为可复用、可迭代的内容资产。", ["AI 辅助拆解课程与卖点", "统一素材、版本与审核状态", "按用户阶段编排学习服务"], "flow"],
    ["08", "获客、转化与社群运营", "GROWTH LOOP", "从流量触达走向线索分层，再把服务体验变成复购动力。", ["内容种草与活动获客", "线索评分与个性化触达", "社群服务与关键节点提醒"], "journey"],
    ["09", "数据分析与复购机制", "DATA FLYWHEEL", "每一次学习和互动都为下一次运营提供证据。", ["用户分层：新客、活跃、沉默、复购", "看板：转化、完成、留存、复购", "策略：触达、激励、升级与召回"], "metric"],
    ["10", "产品与系统架构", "ARCHITECTURE", "以内容、用户、交易、学习和运营数据为核心对象。", ["接入层：内容、活动、支付、社群", "业务层：课程、订单、学习、服务", "数据层：事件、标签、指标与权限"], "architecture"],
    ["11", "一条典型业务流程", "OPERATING MODEL", "从需求进入到复购触达，形成可观测的业务流水线。", ["需求收集 → 内容设计 → 上架转化", "购买 → 学习 → 服务干预", "完成 → 评价 → 复购与推荐"], "flow"],
    ["12", "实施路径与交付节奏", "DELIVERY ROADMAP", "先跑通最小闭环，再逐步扩大内容和数据范围。", ["阶段 1：需求与指标共识", "阶段 2：内容与转化闭环", "阶段 3：学习服务与复购优化"], "timeline"],
    ["13", "效果衡量与合作边界", "MEASUREMENT", "用可验证的指标确认方案价值，并明确本期交付范围。", ["效率：方案制作周期、人工交付时长", "增长：线索转化、客单、复购", "边界：数据接入、品牌资产、实施资源"], "case"],
    ["14", "下一步：用一个真实项目验证闭环", "NEXT STEP", "用 2 周完成一轮小范围验证，形成可复制的交付模板。", ["确认客户目标与首批内容", "选择一条高价值业务链路", "评审指标、范围与上线节奏"], "closing"],
  ];
  const slides = rows.map(([number, title, kicker, takeaway, bullets, visual]) => ({ id: `slide-${number}`, number: Number(number), title, kicker, takeaway, bullets, visual }));
  return { title: "知识付费增长与交付解决方案", subtitle: "把内容价值变成可复制的业务增长", slides, generatedAt: new Date().toISOString() };
}

