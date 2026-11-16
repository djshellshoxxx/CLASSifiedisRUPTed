# PS-114-02 — Validation rules: PWA caching

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M02 PWA caching](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/cache` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-114-02.R01** The build fails when the precache manifest exceeds 1.5 MiB uncompressed or contains a URL that is not same-origin, so that budgets and the trust boundary are enforced before release.
- **PS-114-02.R02** A response is cached only when it passes the cacheability checks (status 200, content-type image for the image cache, no private directives, no cookies).
- **PS-114-02.R03** Violations during build are reported with stable codes; at runtime a violation means the response is served but not stored.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | precache manifest total size ≤ 1572864 bytes and entry count ≤ 120 | PLATFORM_CACHE_PRECACHE_BUDGET |
| V02 | every precache URL is same-origin, versioned by content hash and not under /api/ or /media/private/ | PLATFORM_CACHE_PRIVATE_RESPONSE |
| V03 | runtime image response has status 200 and content-type image/avif, image/webp, image/jpeg or image/png | PLATFORM_CACHE_UNCACHEABLE |
| V04 | response has no Set-Cookie, no Cache-Control private or no-store and no Vary Authorization | PLATFORM_CACHE_UNCACHEABLE |
| V05 | request is GET and carries no Authorization header and no credentials mode include for the image route | PLATFORM_CACHE_PRIVATE_RESPONSE |
| V06 | cache name matches the allowlist for the build (current precache name, classrup-img-v1) or it is deleted on activate | PLATFORM_CACHE_VERSION_MISMATCH |
| V07 | the SKIP_WAITING message origin is a controlled same-origin client | FORBIDDEN |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-114-09.T02 | unit | PS-114-02.R02, PS-114-02.R03 | cacheability function over responses with private, no-store, Set-Cookie, Vary Authorization, 404, text/html | only 200 image responses without private markers return true; others yield PLATFORM_CACHE_UNCACHEABLE |
| TEST-PS-114-09.T03 | integration | PS-114-02.R01 | CI build with manifest enlarged to 1.6 MiB and a /api/ URL injected | build fails with PLATFORM_CACHE_PRECACHE_BUDGET and PLATFORM_CACHE_PRIVATE_RESPONSE |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-UX-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
