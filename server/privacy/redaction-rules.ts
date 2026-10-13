export type RedactionKind = "email" | "phone" | "amount" | "id" | "customer" | "contact" | "project_code";
export type RedactionRule = { kind: RedactionKind; pattern: RegExp; replacement: string };

export const redactionRules: RedactionRule[] = [
  { kind: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu, replacement: "[邮箱已隐藏]" },
  { kind: "phone", pattern: /(?<!\d)(?:\+?86[-\s]?)?1[3-9]\d{9}(?!\d)/g, replacement: "[手机号已隐藏]" },
  { kind: "amount", pattern: /(?<!\w)(?:预算|金额|报价|费用|成本)?\s*[¥￥]?\s*\d+(?:\.\d+)?\s*(?:万|元|万元|人民币)(?!\w)/g, replacement: "[金额已隐藏]" },
  { kind: "id", pattern: /(?<!\d)\d{15,19}(?!\d)/g, replacement: "[账号已隐藏]" },
  { kind: "customer", pattern: /((?:客户|公司|平台|机构)(?:名称)?\s*[:：]\s*)([^\s，,。；;\n]{2,40})/g, replacement: "$1客户 A" },
  { kind: "contact", pattern: /((?:联系人|负责人|对接人)(?:姓名)?\s*[:：]\s*)([^\s，,。；;\n]{2,20})/g, replacement: "$1联系人 1" },
  { kind: "project_code", pattern: /((?:项目|合同|内部代号)(?:编号|代码)?\s*[:：]\s*)([A-Za-z0-9_-]{4,40})/g, replacement: "$1项目代号" },
];
