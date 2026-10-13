import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { userKeyFromCookie } from "../auth/session.js";
import type { ProjectRepository } from "../db/repositories.js";
import type { ObjectStore } from "../storage/types.js";
import { newProjectFileId } from "./projects.js";
import type { ArtifactRepository } from "../artifacts/memory.js";
import type { MaterialSummary } from "../artifacts/types.js";
import { extractMaterial } from "../ingestion/file-parser.js";
import { extractBrandKit } from "../ingestion/brand-extractor.js";
import { redactMaterial } from "../privacy/redactor.js";

export function registerFileRoutes(app: FastifyInstance, repo: ProjectRepository, store: ObjectStore, artifacts?: ArtifactRepository): void {
  app.post("/api/projects/:projectId/files", async (request, reply) => {
    const userKey = userKeyFromCookie(request.headers.cookie);
    if (!userKey) return reply.code(401).send({ error: "unauthorized" });
    const { projectId } = request.params as { projectId: string };
    if (!await repo.getProject(userKey, projectId)) return reply.code(404).send({ error: "project_not_found" });
    const part = await request.file();
    if (!part) return reply.code(400).send({ error: "file_required" });
    const body = await part.toBuffer();
    const sha256 = createHash("sha256").update(body).digest("hex");
    const fileId = newProjectFileId();
    const objectKey = `${userKey}/${projectId}/${fileId}-${part.filename}`;
    await store.put(objectKey, body, { contentType: part.mimetype, sizeBytes: body.byteLength, sha256 });
    const file = await repo.addFile({ id: fileId, projectId, userKey, objectKey, fileName: part.filename, contentType: part.mimetype, sizeBytes: body.byteLength, sha256, createdAt: new Date() });
    let parseStatus: "parsed" | "unsupported" | "failed" = "parsed";
    let materialSummary: MaterialSummary;
    try {
      const material = await extractMaterial({ fileName: part.filename, contentType: part.mimetype, body, sourceFileId: fileId });
      const redacted = redactMaterial(material);
      const excerpt = redacted.redacted.blocks.map((block) => block.text).join("\n").slice(0, 2400);
      materialSummary = { fileId, fileName: part.filename, contentType: part.mimetype, blockCount: redacted.redacted.blocks.length, excerpt, redactionCount: redacted.spans.length, parseStatus, createdAt: new Date().toISOString() };
      if (/presentation|pptx/i.test(part.mimetype) || /\.pptx$/i.test(part.filename)) {
        const brandKit = await extractBrandKit(body);
        if (artifacts) await artifacts.saveMaterial(userKey, projectId, materialSummary);
        if (artifacts) await artifacts.saveBrandKit(userKey, projectId, brandKit);
      } else if (artifacts) await artifacts.saveMaterial(userKey, projectId, materialSummary);
    } catch (error) {
      parseStatus = error instanceof Error && error.message.startsWith("unsupported_file_type") ? "unsupported" : "failed";
      materialSummary = { fileId, fileName: part.filename, contentType: part.mimetype, blockCount: 0, excerpt: "", redactionCount: 0, parseStatus, createdAt: new Date().toISOString() };
      if (artifacts) await artifacts.saveMaterial(userKey, projectId, materialSummary);
    }
    return reply.code(201).send({ file, material: materialSummary });
  });
}
