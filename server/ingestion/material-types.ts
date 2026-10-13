export type MaterialBlockType = "heading" | "paragraph" | "list" | "table";
export type MaterialBlock = { type: MaterialBlockType; text: string; location?: { page?: number; sheet?: string; slide?: number } };
export type MaterialDocument = { fileName: string; contentType: string; blocks: MaterialBlock[]; sourceFileId?: string };
export type InputFile = { fileName: string; contentType: string; body: Uint8Array; sourceFileId?: string };
export type BrandKit = { colors: string[]; headingFont: string; bodyFont: string; slideWidth: number; slideHeight: number; logoObjectKey?: string; warnings: string[] };
