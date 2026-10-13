import Fastify from "fastify";
import { describe, expect, it, beforeEach } from "vitest";
import { loadConfig } from "../config/config.js";
import { assertOAuthState, createAuthorizationUrl, createPkcePair, exchangeAuthorizationCode, fetchUserInfo } from "../server/auth/oauth.js";
import { clearSessionsForTests } from "../server/auth/session.js";
import { registerOAuthRoutes } from "../server/auth/routes.js";

describe("AIGZM OAuth", () => {
  beforeEach(() => clearSessionsForTests());

  it("creates an S256 PKCE pair and authorization URL", async () => {
    const { verifier, challenge } = await createPkcePair();
    expect(verifier.length).toBeGreaterThan(40);
    const url = createAuthorizationUrl(loadConfig({ APP_ENV: "production", DATABASE_URL: "mysql://test", SESSION_SECRET: "12345678901234567890123456789012", AIGZM_CLIENT_ID: "client", AIGZM_CLIENT_SECRET: "secret", AIGZM_EXPECTED_ISSUER: "https://issuer.example", AIGZM_REDIRECT_URI: "https://example.test/api/oauth/callback" }), "state", "nonce", challenge);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("scope")).toBe("identity points.spend");
    expect(url.searchParams.get("redirect_uri")).toBe("https://example.test/api/oauth/callback");
  });

  it("rejects a mismatched OAuth state", () => {
    expect(() => assertOAuthState("expected", "received")).toThrow(/state/);
  });

  it("uses the documented server-side token and userinfo calls", async () => {
    const calls: Request[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      calls.push(new Request(input, init));
      if (calls.length === 1) return new Response(JSON.stringify({ access_token: "access", token_type: "Bearer", expires_in: 3600 }), { status: 200, headers: { "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ iss: "https://issuer.example", sub: "user-1", name: "售前用户" }), { status: 200, headers: { "Content-Type": "application/json" } });
    };
    const config = loadConfig({ APP_ENV: "production", DATABASE_URL: "mysql://test", SESSION_SECRET: "12345678901234567890123456789012", AIGZM_API_ORIGIN: "https://aigzm.com", AIGZM_CLIENT_ID: "client", AIGZM_CLIENT_SECRET: "secret", AIGZM_REDIRECT_URI: "https://example.test/callback", AIGZM_EXPECTED_ISSUER: "https://issuer.example" });
    const token = await exchangeAuthorizationCode(config, "code", "verifier", fetchImpl);
    const identity = await fetchUserInfo(config, token.access_token, fetchImpl);
    expect(identity.subject).toBe("user-1");
    expect(calls[0].url).toContain("/v1/oauth/token");
    expect(calls[0].headers.get("content-type")).toBe("application/json");
    expect(await calls[0].json()).toEqual({ grant_type: "authorization_code", code: "code", code_verifier: "verifier", redirect_uri: "https://example.test/callback", client_id: "client" });
    expect(calls[1].headers.get("authorization")).toBe("Bearer access");
  });

  it("creates a fixture session without external calls", async () => {
    const app = Fastify();
    registerOAuthRoutes(app, loadConfig({ APP_ENV: "fixture" }));
    const response = await app.inject({ method: "GET", url: "/api/oauth/start" });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/projects");
    expect(response.headers["set-cookie"]).toContain("proposal_session=");
    await app.close();
  });
  it("creates a local developer session without exposing the Key", async () => {
    const app = Fastify();
    registerOAuthRoutes(app, loadConfig({ APP_ENV: "developer", AIGZM_API_KEY: "unit-test-secret" }));
    const login = await app.inject({ method: "GET", url: "/api/oauth/start" });
    expect(login.statusCode).toBe(302);
    expect(login.headers.location).toBe("/projects");
    const session = await app.inject({ method: "GET", url: "/api/oauth/session", headers: { cookie: login.headers["set-cookie"] } });
    expect(session.json()).toMatchObject({ authenticated: true, mode: "developer", aiConfigured: true, user: { displayName: "本地开发者" } });
    expect(session.body).not.toContain("unit-test-secret");
    await app.close();
  });
});
