# PS-114-02 — Validation rules: PWA caching

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M02 PWA caching](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/cache` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-114-02.R01** The build fails when the precache manifest exceeds 1.5 MiB uncompressed or contains a URL that is not same-origin, so that budgets and the trust boundary are enforced before release.
- **PS-114-02.R02** A response is cached or handed to the page only when it passes the cacheability checks (status 200, image content type, no private directives, no cookies, at most 5 MiB) and the SHA-256 of its body equals the requested content address.
- **PS-114-02.R03** Violations during build are reported with stable codes; at runtime a cacheability violation means the response is not stored, and a digest mismatch means it is neither stored nor shown.
- **PS-114-02.R04** Control messages are accepted only from controlled same-origin window clients, and SKIP_WAITING only with the one-time nonce that the waiting worker issued in its GET_VERSION reply.
- **PS-114-02.R05** The build fails unless the precache manifest holds every shipped production locale catalog (en, de, fr, es) together within 120 KiB gzip, so the catalogs are installed in one step and no catalog is ever fetched per locale at runtime.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | precache manifest total size ≤ 1572864 bytes and entry count ≤ 120 | PLATFORM_CACHE_PRECACHE_BUDGET |
| V02 | every precache URL is same-origin and versioned by content hash; no relay origin URL and no /__media/ URL is ever precached | PLATFORM_CACHE_PRIVATE_RESPONSE |
| V03 | runtime image response has status 200, content-type image/avif, image/webp, image/jpeg or image/png, and a body ≤ 5242880 bytes | PLATFORM_CACHE_UNCACHEABLE |
| V04 | response has no Set-Cookie, no Cache-Control private or no-store and no Vary Authorization | PLATFORM_CACHE_UNCACHEABLE |
| V05 | image request is a GET with credentials omit and no Authorization header, to /media/v1/sha256-<base64url> on an origin in the bound list of user-selected relays; every other relay-origin request is NetworkOnly | PLATFORM_CACHE_PRIVATE_RESPONSE |
| V06 | cache name matches the allowlist for the build (current precache name, classrup-img-v1-<partition> for partitions of vaults present on this profile) or it is deleted on activate | PLATFORM_CACHE_VERSION_MISMATCH |
| V07 | SKIP_WAITING comes from a controlled same-origin window client and carries the nonce this waiting worker issued in its GET_VERSION reply, unused and at most 60000 ms old | FORBIDDEN |
| V08 | SHA-256 of the response body equals the content address in the request path, checked before the response is cached and before it is handed to the page | PLATFORM_CACHE_DIGEST_MISMATCH |
| V09 | /sw-kill.json is fetched network-only with cache no-store and parses as { formatVersion: 1, minReleaseSeq: int, killedBuilds: buildId[], knownGood?: buildId }; anything else is ignored | VALIDATION_FAILED |
| V10 | the precache manifest lists every production catalog packages/i18n/messages/<locale>.json that the build ships (en, de, fr, es; pseudolocales excluded), their gzip sizes sum to ≤ 122880 bytes (120 KiB), and no route fetches a catalog outside the precache | PLATFORM_CACHE_PRECACHE_BUDGET |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-114-09.T02 | unit | PS-114-02.R02, PS-114-02.R03 | cacheability and verification over responses with private, no-store, Set-Cookie, Vary Authorization, 404, text/html, 6 MiB, wrong digest | only 200 image responses without private markers whose digest matches return true; others yield PLATFORM_CACHE_UNCACHEABLE or PLATFORM_CACHE_DIGEST_MISMATCH |
| TEST-PS-114-09.T03 | integration | PS-114-02.R01 | CI build with manifest enlarged to 1.6 MiB and a relay-origin URL injected | build fails with PLATFORM_CACHE_PRECACHE_BUDGET and PLATFORM_CACHE_PRIVATE_RESPONSE |
| TEST-PS-114-09.T18 | abuse | PS-114-07.R04, PS-114-02.R02, PS-114-09.R03 | stub relay r2 returns different bytes for img1's content address, first with no worker and then with the worker | image neither cached nor displayed, neutral image frame shown, digest_mismatch counted; r1 then supplies the correct bytes which are cached once under the content-address key |
| TEST-PS-114-09.T21 | abuse | PS-114-04.R02, PS-114-02.R04 | page script posts SKIP_WAITING with no nonce, an expired nonce, a used nonce and a nonce from another waiting worker | all ignored with FORBIDDEN counted; the waiting worker stays waiting |
| TEST-PS-114-09.T23 | integration | PS-114-02.R05, PS-114-01.R02 | CI build with the four production catalogs; then with fr removed from the manifest; then with the oversized de fixture pushing the catalogs past 120 KiB gzip | first build lists en, de, fr, es in classrup-precache-v{buildId} and no pseudolocale; the other two fail with PLATFORM_CACHE_PRECACHE_BUDGET |
| TEST-PS-114-09.T24 | e2e | PS-114-07.R05, PS-114-02.R05 | first visit online, then capture all network traffic while switching the locale en, de, fr, es and back, online and offline | every catalog is served from the precache; zero catalog requests reach the static host or any relay; offline switches succeed |

## Dependencies

Module depends on: F15.S02.M01, F15.S02.M03, CTR-CAP-001, CTR-ID-001, CTR-OBS-001, CTR-PRV-001, CTR-UX-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
