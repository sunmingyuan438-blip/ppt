import { describe, expect, it } from "vitest";
import { redactMaterial, applyRedactionEdits } from "../server/privacy/redactor.js";

describe("redaction", () => {
  it("redacts customer contact and amount data before external processing", () => {
    const draft = redactMaterial({ fileName: "brief.txt", contentType: "text/plain", sourceFileId: "f1", blocks: [{ type: "paragraph", text: "客户名称：星河平台，联系人：张三，手机号 13800138000，预算 80 万，邮箱 test@example.com" }] });
    expect(draft.redacted.blocks[0].text).not.toContain("星河平台");
    expect(draft.redacted.blocks[0].text).not.toContain("13800138000");
    expect(draft.spans.length).toBeGreaterThanOrEqual(4);
    const confirmed = applyRedactionEdits(draft, draft.spans.map((span) => ({ id: span.id, confirmed: true })));
    expect(confirmed.warnings).toEqual([]);
    expect(confirmed.redacted.blocks[0].text).not.toContain("张三");
  });
});
