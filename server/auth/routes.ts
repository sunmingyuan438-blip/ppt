import type { FastifyInstance, FastifyRequest } from "fastify";
import type { AppConfig } from "../../config/config.js";
import { assertOAuthState, createAuthorizationUrl, createPkcePair, exchangeAuthorizationCode, fetchUserInfo, randomOpaqueValue } from "./oauth.js";
import { clearSessionCookie, createFixtureSession as createFixtureCookieSession, createLocalDeveloperSession, createSession as storeSession, deleteSession, getSession, serializeSessionCookie, sessionIdFromCookie } from "./session.js";

type PendingState = { state: string; nonce: string; verifier: string; expiresAt: number };
const pending = new Map<string, PendingState>();

function isSecure(request: FastifyRequest): boolean {
  return request.protocol === "https" || request.headers["x-forwarded-proto"] === "https";
}

export function registerOAuthRoutes(app: FastifyInstance, config: AppConfig, fetchImpl: typeof fetch = fetch): void {
  app.get("/api/oauth/start", async (request, reply) => {
    if (config.APP_ENV === "developer") {
      const session = createLocalDeveloperSession();
      reply.header("Set-Cookie", serializeSessionCookie(session.id, isSecure(request)));
      return reply.redirect("/projects");
    }
    if (config.APP_ENV === "fixture") {
      const session = createFixtureCookieSession();
      reply.header("Set-Cookie", serializeSessionCookie(session.id, isSecure(request)));
      return reply.redirect("/projects");
    }
    const { verifier, challenge } = await createPkcePair();
    const state = randomOpaqueValue();
    const nonce = randomOpaqueValue();
    pending.set(state, { state, nonce, verifier, expiresAt: Date.now() + 10 * 60 * 1000 });
    return reply.redirect(createAuthorizationUrl(config, state, nonce, challenge).toString());
  });

  app.get("/api/oauth/callback", async (request, reply) => {
    const query = request.query as { code?: string; state?: string; error?: string };
    const saved = query.state ? pending.get(query.state) : undefined;
    pending.delete(query.state ?? "");
    try {
      if (query.error || !saved || saved.expiresAt <= Date.now()) throw new Error("OAuth authorization was not completed");
      assertOAuthState(saved.state, query.state);
      if (!query.code) throw new Error("OAuth authorization code is missing");
      const token = await exchangeAuthorizationCode(config, query.code, saved.verifier, fetchImpl);
      const identity = await fetchUserInfo(config, token.access_token, fetchImpl);
      const session = storeSession(identity, token);
      reply.header("Set-Cookie", serializeSessionCookie(session.id, isSecure(request)));
      return reply.redirect("/projects");
    } catch (error) {
      request.log.warn({ error: error instanceof Error ? error.message : "oauth_failed" }, "OAuth callback failed");
      reply.header("Set-Cookie", clearSessionCookie(isSecure(request)));
      return reply.code(400).type("text/html").send("<h1>OAuth 未完成</h1><p>授权未完成，请返回应用重新连接。</p>");
    }
  });

  app.get("/api/oauth/session", async (request, reply) => {
    const session = getSession(sessionIdFromCookie(request.headers.cookie));
    if (!session) return reply.code(401).send({ authenticated: false });
    return { authenticated: true, mode: config.APP_ENV, aiConfigured: config.APP_ENV === "developer" ? Boolean(config.AIGZM_API_KEY?.trim()) : config.APP_ENV === "production", user: { subject: session.identity.subject, displayName: session.identity.displayName } };
  });

  app.post("/api/oauth/logout", async (request, reply) => {
    const id = sessionIdFromCookie(request.headers.cookie);
    deleteSession(id);
    reply.header("Set-Cookie", clearSessionCookie(isSecure(request)));
    return { ok: true };
  });
}
