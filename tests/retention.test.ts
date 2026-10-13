import { describe, expect, it } from "vitest";
import { MemoryProjectRepository } from "../server/db/repositories.js";
import { cleanupExpiredProjects } from "../server/db/retention.js";
import { MemoryObjectStore } from "../server/storage/memory.js";

describe("30-day retention", () => {
  it("deletes expired projects and their objects", async () => {
    const repo = new MemoryProjectRepository();
    const store = new MemoryObjectStore();
    const created = await repo.createProject("issuer|user", { title: "过期方案", now: new Date("2026-01-01T00:00:00Z") });
    await store.put("issuer|user/file", new Uint8Array([1, 2]), { contentType: "text/plain", sizeBytes: 2 });
    await repo.addFile({ id: "file-1", projectId: created.id, userKey: "issuer|user", objectKey: "issuer|user/file", fileName: "notes.txt", contentType: "text/plain", sizeBytes: 2, sha256: "x", createdAt: new Date("2026-01-01T00:00:00Z") });
    const result = await cleanupExpiredProjects(repo, store, new Date("2026-02-01T00:00:00Z"));
    expect(result).toEqual({ projects: 1, objects: 1 });
    expect(store.has("issuer|user/file")).toBe(false);
    expect(repo.projects.has(created.id)).toBe(false);
  });
});
