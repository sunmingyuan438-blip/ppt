import type { BrandKit } from "../ingestion/material-types.js";

export type BriefInput = {
  customerNeed: string;
  currentApproach: string;
  deliverable: string;
  painPoint: string;
  duration: string;
  referenceUrls: string;
};

export type RedactionNotice = { kind: string; count: number; label: string };
export type ResearchSource = { id: string; url: string; title: string; summary: string; status: "confirmed" | "needs_review" | "failed"; observedAt: string };

export type BriefSummary = {
  projectContext: string;
  businessGoal: string;
  audience: string[];
  painPoints: string[];
  successCriteria: string[];
  constraints: string[];
  redactedText: string;
  notices: RedactionNotice[];
  sources: ResearchSource[];
  generatedAt: string;
};

export type OutlineSlide = {
  id: string;
  number: number;
  title: string;
  kicker: string;
  takeaway: string;
  bullets: string[];
  visual: "metric" | "journey" | "flow" | "architecture" | "timeline" | "case" | "table" | "closing";
};

export type Outline = { title: string; subtitle: string; slides: OutlineSlide[]; generatedAt: string };

export type DeckSlide = OutlineSlide & { speakerNotes?: string };

export type MaterialSummary = {
  fileId: string;
  fileName: string;
  contentType: string;
  blockCount: number;
  excerpt: string;
  redactionCount: number;
  parseStatus: "parsed" | "unsupported" | "failed";
  createdAt: string;
};

export type ProjectArtifacts = {
  brief?: BriefSummary;
  outline?: Outline;
  deck?: { slides: DeckSlide[]; generatedAt: string; fileName: string };
  brandKit?: BrandKit;
  materials?: MaterialSummary[];
  updatedAt?: string;
};

