import type { FastifyInstance } from "fastify";
export function registerHealthRoute(app: FastifyInstance, version: string) { app.get("/health", async () => ({ status: "ok", version })); }
