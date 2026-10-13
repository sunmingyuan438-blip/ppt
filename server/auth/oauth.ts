import { createHash, randomBytes } from "node:crypto";
import type { AppConfig } from "../../config/config.js";

const encoder = new TextEncoder();

function base64Url(value: Buffer | Uint8Array): string {
  return Buffer.from(value).toString("base64url");
}

export type OAuthToken = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
  id_token?: string;
};

export type ExternalIdentity = {
  issuer: string;
  subject: string;
  displayName?: string;
};

export async function createPkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifier = base64Url(randomBytes(32));
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(verifier));
  return { verifier, challenge: base64Url(new Uint8Array(digest)) };
}

export function randomOpaqueValue(bytes = 32): string {
  return base64Url(randomBytes(bytes));
}

export function createAuthorizationUrl(config: AppConfig, state: string, nonce: string, challenge: string): URL {
  if (!config.AIGZM_CLIENT_ID || !config.AIGZM_REDIRECT_URI) throw new Error("AIGZM OAuth is not configured");
  const url = new URL("/oauth/authorize", config.AIGZM_AUTHORIZATION_UI_ORIGIN);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: config.AIGZM_CLIENT_ID,
    redirect_uri: config.AIGZM_REDIRECT_URI,
    scope: "identity points.spend",
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
    nonce,
  }).toString();
  return url;
}

export async function exchangeAuthorizationCode(config: AppConfig, code: string, verifier: string, fetchImpl: typeof fetch = fetch): Promise<OAuthToken> {
  if (!config.AIGZM_CLIENT_ID || !config.AIGZM_CLIENT_SECRET || !config.AIGZM_REDIRECT_URI) throw new Error("AIGZM OAuth is not configured");
  const basic = Buffer.from(`${config.AIGZM_CLIENT_ID}:${config.AIGZM_CLIENT_SECRET}`).toString("base64");
  const response = await fetchImpl(new URL("/v1/oauth/token", config.AIGZM_API_ORIGIN), {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ grant_type: "authorization_code", code, code_verifier: verifier, redirect_uri: config.AIGZM_REDIRECT_URI, client_id: config.AIGZM_CLIENT_ID }),
  });
  if (!response.ok) throw new Error("OAuth token exchange failed");
  const token = await response.json() as OAuthToken;
  if (!token.access_token) throw new Error("OAuth token response was incomplete");
  return token;
}

export async function fetchUserInfo(config: AppConfig, accessToken: string, fetchImpl: typeof fetch = fetch): Promise<ExternalIdentity> {
  const response = await fetchImpl(new URL("/v1/oauth/userinfo", config.AIGZM_API_ORIGIN), { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } });
  if (!response.ok) throw new Error("OAuth userinfo request failed");
  const body = await response.json() as Record<string, unknown>;
  const issuer = String(body.iss ?? body.issuer ?? config.AIGZM_EXPECTED_ISSUER ?? "");
  const subject = String(body.sub ?? "");
  if (!subject || (config.AIGZM_EXPECTED_ISSUER && issuer !== config.AIGZM_EXPECTED_ISSUER)) throw new Error("OAuth identity validation failed");
  return { issuer, subject, displayName: typeof body.name === "string" ? body.name : undefined };
}

export function assertOAuthState(expected: string | undefined, received: string | undefined): void {
  if (!expected || !received || expected !== received) throw new Error("OAuth state validation failed");
}
