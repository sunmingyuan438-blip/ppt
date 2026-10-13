# Developer API Key local integration

The user approved Developer API Key calls charged to their developer account on 2026-10-13. Implement a local `APP_ENV=developer` profile. This profile uses a local workspace session and the developer invoke endpoint with a single X-API-Key header. It does not consume the workspace session token as a platform credential. Fixture and production OAuth profiles keep their existing behavior.

The API Key is read exclusively from server environment or the ignored project-root `.env`; never return it from an endpoint. Bind local development servers to loopback. Missing credentials leave the UI reachable and return an explicit error at generation time. The UI identifies developer billing and shows whether the credential is configured. Do not fabricate generated content when credentials are missing or upstream invocation fails.

Use the live catalog for model availability, stable idempotency keys per invocation, 120-second text timeout and the existing output validators. Verify the developer endpoint/header, credential isolation, missing-key behavior, local session flow and existing workflows. Actual platform integration requires a delivered, active API Key. Do not claim live generation until it has been observed.
