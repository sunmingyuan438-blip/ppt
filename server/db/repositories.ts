import { randomUUID } from "node:crypto";

export type ProjectStatus = "draft" | "redaction_pending" | "summary_pending" | "research_running" | "outline_pending" | "generation_running" | "ready" | "editing" | "export_ready" | "expired";
export type Project = { id: string; userKey: string; title: string; templateKey: string; status: ProjectStatus; createdAt: Date; updatedAt: Date; expiresAt: Date };
export type ProjectFile = { id: string; projectId: string; userKey: string; objectKey: string; fileName: string; contentType: string; sizeBytes: number; sha256: string; createdAt: Date };

export interface ProjectRepository {
  createProject(userKey: string, input: { title: string; templateKey?: string; now?: Date }): Promise<Project>;
  listProjects(userKey: string, now?: Date): Promise<Project[]>;
  getProject(userKey: string, id: string, now?: Date): Promise<Project | null>;
  deleteProject(userKey: string, id: string): Promise<void>;
  addFile(file: ProjectFile): Promise<ProjectFile>;
  listFiles(userKey: string, projectId: string): Promise<ProjectFile[]>;
}

export class MemoryProjectRepository implements ProjectRepository {
  readonly projects = new Map<string, Project>();
  readonly files = new Map<string, ProjectFile>();
  async createProject(userKey: string, input: { title: string; templateKey?: string; now?: Date }): Promise<Project> {
    const now = input.now ?? new Date();
    const project: Project = { id: randomUUID(), userKey, title: input.title.trim(), templateKey: input.templateKey ?? "knowledge-commerce", status: "draft", createdAt: now, updatedAt: now, expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) };
    this.projects.set(project.id, project);
    return project;
  }
  async listProjects(userKey: string, now = new Date()): Promise<Project[]> { return [...this.projects.values()].filter((project) => project.userKey === userKey && project.expiresAt > now); }
  async getProject(userKey: string, id: string, now = new Date()): Promise<Project | null> { const project = this.projects.get(id); return project && project.userKey === userKey && project.expiresAt > now ? project : null; }
  async deleteProject(userKey: string, id: string): Promise<void> { const project = await this.getProject(userKey, id); if (project) { this.projects.delete(id); for (const [fileId, file] of this.files) if (file.projectId === id && file.userKey === userKey) this.files.delete(fileId); } }
  async addFile(file: ProjectFile): Promise<ProjectFile> { this.files.set(file.id, file); return file; }
  async listFiles(userKey: string, projectId: string): Promise<ProjectFile[]> { return [...this.files.values()].filter((file) => file.userKey === userKey && file.projectId === projectId); }
}
