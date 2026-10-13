# Developer AI Integration Implementation Plan

> Execute inline in this chat under the user's existing development authorization.

**Goal:** Run real PPT generation locally using the owner's Developer API Key.

**Architecture:** Add `developer` to APP_ENV. Local workspace sessions authorize local routes; only the server-side AIGZM_API_KEY authorizes the developer model gateway. Preserve fixture and production OAuth profiles.

**Tech Stack:** TypeScript, Fastify, React, Vitest.

**Spec:** ../specs/2026-10-13-developer-ai-design.md

## Global Constraints

- Secrets are server-only and `.env` is Git-ignored.
- Only one platform credential is sent per invocation.
- Local development binds to loopback.
- No automatic retries of chargeable model requests.

## Task 1: Developer gateway

Files: config/config.ts, server/ai/model-client.ts, tests/config.test.ts, tests/model-client.test.ts.

- [x] Add APP_ENV `developer` and optional AIGZM_API_KEY.
- [x] Test that the developer invoke path sends X-API-Key and never the local token or OAuth client fields; missing credentials cause zero fetches.
- [x] Select `/v1/developer/models/{modelKey}/invoke` in developer mode and preserve the OAuth endpoint in production.
- [x] Run gateway and config tests as part of `npm test` (30 tests passed).

## Task 2: Local workspace and setup

Files: server/auth/session.ts, server/auth/routes.ts, server/index.ts, vite.config.ts, src/main.tsx, .env.example, README.md, tests/auth.test.ts.

- [x] Create a local developer session and return mode plus a boolean key status in the session response.
- [x] Show developer billing mode and missing-key guidance in the workspace without rendering credentials.
- [x] Bind developer API and Vite to 127.0.0.1.
- [x] Prepare an ignored `.env` with APP_ENV=developer and an empty AIGZM_API_KEY.
- [x] Verify localhost login and session metadata; project route authorization tests pass.
- [x] Run `npm run typecheck`, `npm test`, `npm run build` and `git diff --check`.
- [ ] When an active key is configured, restart the API, then run one real brief/outline/export flow and retain only request IDs and validation results.
