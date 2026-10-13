import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { userKeyFromCookie } from "../auth/session.js";
import type { ProjectRepository } from "../db/repositories.js";

export function registerProjectRoutes(app: FastifyInstance, repo: ProjectRepository): void {
  app.get("/api/projects", async (request, reply) => {
    const userKey = userKeyFromCookie(request.headers.cookie);
    if (!userKey) return reply.code(401).send({ error: "unauthorized" });
    return { projects: await repo.listProjects(userKey) };
  });

  app.post("/api/projects", async (request, reply) => {
    const userKey = userKeyFromCookie(request.headers.cookie);
    if (!userKey) return reply.code(401).send({ error: "unauthorized" });
    const body = (request.body ?? {}) as { title?: string; templateKey?: string };
    if (!body.title?.trim()) return reply.code(400).send({ error: "title_required" });
    const project = await repo.createProject(userKey, { title: body.title, templateKey: body.templateKey });
    return reply.code(201).send({ project });
  });

  app.get("/api/projects/:projectId", async (request, reply) => {
    const userKey = userKeyFromCookie(request.headers.cookie);
    if (!userKey) return reply.code(401).send({ error: "unauthorized" });
    const { projectId } = request.params as { projectId: string };
    const project = await repo.getProject(userKey, projectId);
    if (!project) return reply.code(404).send({ error: "project_not_found" });
    return { project, files: await repo.listFiles(userKey, projectId) };
  });

  app.delete("/api/projects/:projectId", async (request, reply) => {
    const userKey = userKeyFromCookie(request.headers.cookie);
    if (!userKey) return reply.code(401).send({ error: "unauthorized" });
    const { projectId } = request.params as { projectId: string };
    await repo.deleteProject(userKey, projectId);
    return reply.code(204).send();
  });
}

export function newProjectFileId(): string { return randomUUID(); }
