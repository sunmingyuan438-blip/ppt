import type { BriefSummary, MaterialSummary, Outline, ProjectArtifacts } from "./types.js";
import type { BrandKit } from "../ingestion/material-types.js";

export interface ArtifactRepository {
  get(userKey: string, projectId: string): Promise<ProjectArtifacts>;
  saveBrief(userKey: string, projectId: string, brief: BriefSummary): Promise<ProjectArtifacts>;
  saveOutline(userKey: string, projectId: string, outline: Outline): Promise<ProjectArtifacts>;
  saveDeck(userKey: string, projectId: string, deck: NonNullable<ProjectArtifacts["deck"]>): Promise<ProjectArtifacts>;
  saveMaterial(userKey: string, projectId: string, material: MaterialSummary): Promise<ProjectArtifacts>;
  saveBrandKit(userKey: string, projectId: string, brandKit: BrandKit): Promise<ProjectArtifacts>;
}

export class MemoryArtifactRepository implements ArtifactRepository {
  private readonly records = new Map<string, ProjectArtifacts>();
  private key(userKey: string, projectId: string): string { return `${userKey}:${projectId}`; }
  async get(userKey: string, projectId: string): Promise<ProjectArtifacts> { return this.records.get(this.key(userKey, projectId)) ?? {}; }
  private write(userKey: string, projectId: string, value: ProjectArtifacts): ProjectArtifacts {
    const next = { ...value, updatedAt: new Date().toISOString() };
    this.records.set(this.key(userKey, projectId), next);
    return next;
  }
  async saveBrief(userKey: string, projectId: string, brief: BriefSummary): Promise<ProjectArtifacts> { return this.write(userKey, projectId, { ...(await this.get(userKey, projectId)), brief }); }
  async saveOutline(userKey: string, projectId: string, outline: Outline): Promise<ProjectArtifacts> { return this.write(userKey, projectId, { ...(await this.get(userKey, projectId)), outline }); }
  async saveDeck(userKey: string, projectId: string, deck: NonNullable<ProjectArtifacts["deck"]>): Promise<ProjectArtifacts> { return this.write(userKey, projectId, { ...(await this.get(userKey, projectId)), deck }); }
  async saveMaterial(userKey: string, projectId: string, material: MaterialSummary): Promise<ProjectArtifacts> { const current = await this.get(userKey, projectId); return this.write(userKey, projectId, { ...current, materials: [...(current.materials ?? []).filter((item) => item.fileId !== material.fileId), material] }); }
  async saveBrandKit(userKey: string, projectId: string, brandKit: BrandKit): Promise<ProjectArtifacts> { return this.write(userKey, projectId, { ...(await this.get(userKey, projectId)), brandKit }); }
}

