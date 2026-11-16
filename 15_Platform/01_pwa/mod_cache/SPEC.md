# F15.S01.M02 — PWA caching

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F15.S01](../SPEC.md). **Process IDs:** PS-114-01…PS-114-10. **Code:** `apps/pwa/src/platform/cache`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The service worker (Vite 8.3.5 with vite-plugin-pwa 2.0.0, injectManifest strategy, Workbox 7.4.1) makes the app shell load offline after the first visit, caches public listing images with stale-while-revalidate, and never caches authenticated API traffic or private media. Every cache name carries a version so old caches are deleted when a release activates, and a waiting worker only takes over after the user consents through F15.S01.M03. The static PWA host serves only these files; it is never the backend (ADR-0001).

## Responsibilities

- Precache the app shell (HTML entry, hashed JS and CSS, fonts, icons, locale catalogs for the default locale) within a 1.5 MiB budget and serve navigations from the precached index.html when offline.
- Serve public listing images with StaleWhileRevalidate from cache classrup-img-v1, limited to 200 entries and 30 days, and drop them first under storage pressure.
- Send every authenticated API request, private media request and non-GET request straight to the network (NetworkOnly) so no user data is ever written to a cache.
- Delete outdated precaches and runtime caches on activate using the cache-name allowlist, and clear user-visible runtime caches on sign-out.

## Not responsible for

- Install prompt, manifest and the update-available UI (F15.S01.M03 mod_install); this module only exposes the SKIP_WAITING message handler.
- Queueing failed writes (F15.S01.M01 mod_offline); the service worker does not use Workbox background sync for authenticated commands.
- Server-side cache headers of an optional relay (F15.S02.M01 mod_relays sets Cache-Control on public media); the PWA works with no relay after install.
- Future: offline read cache for the member's own listings and conversations encrypted at rest; Future: periodic background sync of saved searches.

## User stories

- As a member on a flaky connection, I can open the app after my first visit with no signal and see the shell, my pending actions and previously viewed public listing images.
- As a member, I never see another person's private data in an offline cache after signing out on a shared phone.
- As a member, when a new version is available I keep using the current one until I choose to update.

## Edge cases

- A public image URL starts returning 404 or 410 after a listing is removed; the stale cached copy is served once, the revalidation response replaces nothing (non-200 is not cached) and the entry is evicted by the next cleanup.
- A response to an image request carries Cache-Control private or no-store, a Set-Cookie header or Vary Authorization; the worker refuses to store it and serves the network response.
- Storage quota is nearly full (navigator.storage.estimate usage over 80 percent); runtime image cache is purged and precache stays, and QuotaExceededError never breaks a fetch.
- A user opens an old tab after a release; the old worker still serves its own precache until the new one is activated by consent, and requests for hashed assets that no longer exist fall back to the network with a reload prompt.
- No relay is configured or the selected relay is unreachable and the user navigates to a deep link; the precached index.html loads, the router renders, and API calls fail with an offline state instead of a browser error page.
- The static host returns its own 404 page for a missing asset; the worker does not cache non-200 or text/html responses for asset URLs.

## UX and accessibility



Headless worker. User-visible effects: offline banner 'You are offline, showing saved content' (role=status) driven by F15.S01.M01 state, a stale image shows no extra chrome, and storage-pressure purge is silent. The update prompt belongs to F15.S01.M03.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

CTR-OBS-001, CTR-PRV-001, CTR-UX-001, CTR-ERR-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-114-01 | [Domain schema](domain_schema.md) | 3 |
| PS-114-02 | [Validation rules](validation_rules.md) | 3 |
| PS-114-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-114-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-114-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-114-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-114-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-114-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-114-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-114-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `apps/pwa/src/platform/cache/index.ts`.

## Acceptance criteria

- All tests T01-T17 pass in CI.
- After first visit the app shell opens offline in under 2.5 s LCP on a Moto G-class 4G profile.
- No authenticated response or private media is ever present in Cache Storage (abuse suite T08, T09).
- A new release never takes control without user consent while a client is open.
