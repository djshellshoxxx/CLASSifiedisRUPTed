# F15.S01.M02 — PWA caching

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F15.S01](../SPEC.md). **Process IDs:** PS-114-01…PS-114-10. **Code:** `apps/pwa/src/platform/cache`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The service worker (Vite 8.3.5 with vite-plugin-pwa 2.0.0, injectManifest strategy, Workbox 7.4.1) makes the app shell load offline after the first visit, caches public listing images and never caches vault data, relay commands or private media. Public images are content-addressed media blobs (N9) fetched from the user-selected relays' public media route (F15.S02.M01, GET /media/v1/sha256-<base64url>); the worker checks that the bytes hash to the requested content address before it caches or shows them, and keys the cache by content address in a per-principal partition, so no relay can swap a photo and no principal on a shared browser profile sees what another viewed. Every cache name carries a version so old caches are deleted when a release activates, a waiting worker only takes over after the user consents through F15.S01.M03, and a kill file lets the static host replace a bad build with a known-good one. The static PWA host serves only these files; it is never a relay and never authoritative (ADR-0016).

## Responsibilities

- Precache the app shell (HTML entry, hashed JS and CSS, fonts, icons and every shipped production locale catalog - en, de, fr and es of F14.S02.M01, at most 120 KiB gzip together - installed together at service-worker install, never only the default locale) within a 1.5 MiB budget and serve navigations from the precached index.html when offline.
- Serve public listing images cache-first from the per-principal cache classrup-img-v1-<partition>, keyed by content address and independent of the relay that served them, limited to 200 entries and 30 days per partition, after verifying SHA-256 of the body against the content address, and drop them first under storage pressure.
- Send every other request to a user-selected relay origin (relay commands and queries, mailbox, private or encrypted media) and every non-GET request straight to the network (NetworkOnly) so no user data is ever written to a cache.
- Delete outdated precaches and runtime caches on activate using the cache-name allowlist, unbind the principal's image partition on vault lock and principal switch, and delete it on Erase vault (CLEAR_USER_CACHES).
- [object Object]

## Not responsible for

- Install prompt, manifest, release-manifest verification and the update-available UI (F15.S01.M03 mod_install); this module only exposes the nonce-guarded SKIP_WAITING message handler.
- Queueing failed writes (F15.S01.M01 mod_offline); the service worker does not use Workbox background sync for relay commands.
- The public media route and its headers (F15.S02.M01 serves GET /media/v1/sha256-<base64url> from F15.S02.M03 blobs) and metadata stripping before content addressing (F10.S02.M03 in the author's vault); the PWA works with no relay after install.
- The list of user-selected relays (relay selection in the vault); the worker receives the origins in memory with BIND_PARTITION.
- Future: offline read cache for the member's own listings and conversations encrypted at rest; Future: periodic background sync of saved searches.

## User stories

- As a member on a flaky connection, I can open the app after my first visit with no signal and see the shell, my pending actions and previously viewed public listing images.
- As a member sharing a browser profile, another principal never sees which listing images I viewed, and locking my vault stops my image cache from being used.
- As a member, a relay cannot swap the photo of a listing I looked at, because the app shows only bytes that match the photo's content address.
- As a member, when a new version is available I keep using the current one until I choose to update.

## Edge cases

- A public image starts returning 404 or 410 after a listing is removed; a cached verified copy is served, the background check sees the non-200 status, nothing is stored and the entry is evicted.
- A relay returns bytes for /media/v1/sha256-X that do not hash to X; the response is discarded, counted as a digest mismatch, never cached or shown, and the next selected relay is tried.
- A response to an image request carries Cache-Control private or no-store, a Set-Cookie header or Vary Authorization; the worker refuses to store it.
- Storage quota is nearly full (navigator.storage.estimate usage over 80 percent); the image partitions are purged and precache stays, and QuotaExceededError never breaks a fetch.
- A user opens an old tab after a release; the old worker still serves its own precache until the new one is activated by consent, and requests for hashed assets that no longer exist fall back to the network with a reload prompt.
- No relay is configured or the selected relay is unreachable and the user navigates to a deep link; the precached index.html loads, the router renders, and relay calls fail with an offline state instead of a browser error page.
- The static host returns its own 404 page for a missing asset; the worker does not cache non-200 or text/html responses for asset URLs.
- A page script posts SKIP_WAITING without the nonce of the waiting worker, or replays an old nonce; the worker ignores it.
- The kill file names the active build but the known-good build cannot be fetched; the worker deletes its caches and unregisters, and the spec states that the next start then needs the network once.

## UX and accessibility



Headless worker. User-visible effects: offline banner 'You are offline, showing saved content' (role=status) driven by F15.S01.M01 state, a cached image shows no extra chrome, an image that failed verification shows the neutral listing image frame with 'Image could not be verified', storage-pressure purge is silent, and after a kill-switch replacement the app shows 'A faulty version was replaced' once. The update prompt belongs to F15.S01.M03.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F15.S02.M01, F15.S02.M03, CTR-CAP-001, CTR-ID-001, CTR-OBS-001, CTR-PRV-001, CTR-UX-001, CTR-ERR-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-114-01 | [Domain schema](domain_schema.md) | 4 |
| PS-114-02 | [Validation rules](validation_rules.md) | 5 |
| PS-114-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-114-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-114-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-114-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-114-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 5 |
| PS-114-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-114-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-114-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `apps/pwa/src/platform/cache/index.ts`.

## Acceptance criteria

- All tests T01-T24 pass in CI.
- After first visit the app shell opens offline in under 2.5 s LCP on a Moto G-class 4G profile.
- No relay command response, vault data or private media is ever present in Cache Storage, and no image whose bytes fail content-address verification is ever cached or shown (abuse suite T08, T09, T18).
- A new release never takes control without user consent while a client is open, except a known-good replacement ordered by the kill file.
