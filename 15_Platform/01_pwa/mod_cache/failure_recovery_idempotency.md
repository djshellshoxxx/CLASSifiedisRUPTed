# PS-114-06 — Failure recovery and idempotency: PWA caching

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M02 PWA caching](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/cache` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-114-06.R01** A failed install never replaces a working worker, and a failed runtime cache write never fails the response.
- **PS-114-06.R02** Fetch handlers are stateless; repeating a request has the same effect as a single request.
- **PS-114-06.R03** Offline navigation always resolves to the precached shell, and API failures are surfaced as network errors to the page for the outbox and UI to handle.

## Specification

- **idempotency:** Fetch handling is idempotent: caches are keyed by URL and revision, replays of install or activate produce the same cache contents. Non-GET requests are never handled.
- **concurrency:** Several tabs share one worker; cache writes are by key and last write wins for identical content. Update takes effect for all tabs at once after consent, and the page reloads each tab on controllerchange.
- **retries:** The worker does not retry fetches; page code retries per CTR-IDM-001 IDM-4. Install retries automatically by the browser's update check on the next trigger.
- **offline:** After first visit the shell, route chunks needed by the entry route, icons and the default locale load without network. Dynamic route chunks not yet visited need network; the router shows an offline page with Retry (precached offline.html, 4 KiB).
- **partial failure:** If precache of one entry fails the whole install is aborted and the previous version stays active. If activation cleanup fails midway, the next activation re-runs the allowlist deletion, which is safe to repeat.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-114-09.T10 | e2e | PS-114-06.R01, PS-114-06.R03 | first visit online then go offline and open a deep link /l/abc | shell renders, relay calls show offline state, no browser error page |
| TEST-PS-114-09.T11 | integration | PS-114-06.R02, PS-114-06.R01 | simulate QuotaExceededError on cache put and a slow image request | response still delivered; cache write error counted; no unhandled rejection |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-UX-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
