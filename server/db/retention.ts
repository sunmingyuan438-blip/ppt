import type { ObjectStore } from "../storage/types.js";
import type { MemoryProjectRepository } from "./repositories.js";

export async function cleanupExpiredProjects(repo: MemoryProjectRepository, store: ObjectStore, now = new Date()): Promise<{ projects: number; objects: number }> {
  let projects = 0;
  let objects = 0;
  for (const project of [...repo.projects.values()]) {
    if (project.expiresAt > now) continue;
    const files = await repo.listFiles(project.userKey, project.id);
    for (const file of files) { await store.delete(file.objectKey); objects += 1; }
    repo.projects.delete(project.id);
    for (const file of files) repo.files.delete(file.id);
    projects += 1;
  }
  return { projects, objects };
}
