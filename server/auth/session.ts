import { randomOpaqueValue, type ExternalIdentity, type OAuthToken } from "./oauth.js";

export const SESSION_COOKIE = "proposal_session";
const sessions = new Map<string, SessionContext>();

export type SessionContext = {
  id: string;
  identity: ExternalIdentity;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};

export function createSession(identity: ExternalIdentity, token: OAuthToken): SessionContext {
  const session: SessionContext = {
    id: randomOpaqueValue(32),
    identity,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
  };
  sessions.set(session.id, session);
  return session;
}

export function createFixtureSession(): SessionContext {
  return createSession({ issuer: "fixture-issuer", subject: "fixture-user", displayName: "Fixture User" }, { access_token: "fixture-access-token", token_type: "Bearer", expires_in: 86400 });
}

export function createLocalDeveloperSession(): SessionContext {
  return createSession({ issuer: "local-developer", subject: "workspace-owner", displayName: "本地开发者" }, { access_token: "local-workspace-session", token_type: "local", expires_in: 3600 });
}

export function getSession(id: string | undefined): SessionContext | null {
  if (!id) return null;
  const session = sessions.get(id);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(id);
    return null;
  }
  return session;
}

export function deleteSession(id: string | undefined): void {
  if (id) sessions.delete(id);
}

export function clearSessionsForTests(): void {
  sessions.clear();
}

export function serializeSessionCookie(id: string, secure: boolean): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(id)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600${secure ? "; Secure" : ""}`;
}

export function clearSessionCookie(secure: boolean): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}

export function sessionIdFromCookie(cookieHeader: string | undefined): string | undefined {
  const value = cookieHeader?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return value ? decodeURIComponent(value.slice(SESSION_COOKIE.length + 1)) : undefined;
}

export function userKeyFromCookie(cookieHeader: string | undefined): string | null {
  const session = getSession(sessionIdFromCookie(cookieHeader));
  return session ? `${session.identity.issuer}|${session.identity.subject}` : null;
}
