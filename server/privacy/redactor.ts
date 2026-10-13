import type { MaterialDocument } from "../ingestion/material-types.js";
import { redactionRules, type RedactionKind } from "./redaction-rules.js";

export type RedactionSpan = { id: string; kind: RedactionKind; original: string; replacement: string; sourceFileId?: string; confirmed: boolean };
export type RedactionDraft = { original: MaterialDocument; redacted: MaterialDocument; spans: RedactionSpan[]; warnings: string[] };
export type RedactionEdit = { id: string; replacement?: string; confirmed?: boolean };

export function redactText(text: string, sourceFileId: string | undefined, spans: RedactionSpan[]): string {
  let value = text;
  for (const rule of redactionRules) {
    value = value.replace(rule.pattern, (...args: unknown[]) => {
      const original = String(args[0]);
      const replacement = rule.replacement.replace(/\$1/g, String(args[1] ?? ""));
      spans.push({ id: `${spans.length + 1}`, kind: rule.kind, original, replacement, sourceFileId, confirmed: false });
      return replacement;
    });
  }
  return value;
}

export function redactMaterial(document: MaterialDocument): RedactionDraft {
  const spans: RedactionSpan[] = [];
  const redacted = { ...document, blocks: document.blocks.map((block) => ({ ...block, text: redactText(block.text, document.sourceFileId, spans) })) };
  return { original: document, redacted, spans, warnings: spans.length ? [] : ["no_sensitive_fields_detected_review_before_external_processing"] };
}

export function applyRedactionEdits(draft: RedactionDraft, edits: RedactionEdit[]): RedactionDraft {
  const byId = new Map(edits.map((edit) => [edit.id, edit]));
  const spans = draft.spans.map((span) => ({ ...span, replacement: byId.get(span.id)?.replacement ?? span.replacement, confirmed: byId.get(span.id)?.confirmed ?? true }));
  const replacements = new Map(spans.map((span) => [span.original, span.replacement]));
  const redacted = { ...draft.redacted, blocks: draft.original.blocks.map((block) => ({ ...block, text: [...replacements.entries()].reduce((value, [original, replacement]) => value.split(original).join(replacement), block.text) })) };
  return { ...draft, redacted, spans, warnings: spans.some((span) => !span.confirmed) ? ["redaction_confirmation_required"] : [] };
}
