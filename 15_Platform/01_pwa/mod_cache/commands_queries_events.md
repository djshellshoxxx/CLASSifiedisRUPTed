# PS-114-04 — Commands, queries and events: PWA caching

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M02 PWA caching](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/cache` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-114-04.R01** The module exposes no relay commands or queries; its interface is the fetch event routing table and three postMessage messages (SKIP_WAITING, CLEAR_USER_CACHES, GET_VERSION).
- **PS-114-04.R02** Messages are accepted only from same-origin window clients and unknown message types are ignored.
- **PS-114-04.R03** The module produces no domain events and consumes none; version and cache status are available to the page through GET_VERSION.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PLATFORM_CACHE_PRECACHE_BUDGET | 422 | no | build-time failure, precache manifest exceeds 1.5 MiB or 120 entries |
| PLATFORM_CACHE_PRIVATE_RESPONSE | 422 | no | an authenticated or private URL would be cached |
| PLATFORM_CACHE_UNCACHEABLE | 422 | no | response failed cacheability checks and is served without storing |
| PLATFORM_CACHE_VERSION_MISMATCH | 409 | no | cache name not on the allowlist for this build and deleted at activation |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Service worker module without relay commands or queries. Interface: fetch routing table plus postMessage messages SKIP_WAITING (activate waiting worker), CLEAR_USER_CACHES (delete classrup-img-v1), GET_VERSION (returns { buildId, precacheName, imgEntries }).

### Example

```
// sw.ts routing table (order matters)
1. precacheAndRoute(self.__WB_MANIFEST)                               // app shell, hashed assets
2. NavigationRoute(createHandlerBoundToURL('/index.html'), { denylist: [/^\/api\//, /^\/media\/private\//, /^\/\.well-known\//] })
3. registerRoute(({url}) => url.pathname.startsWith('/media/public/') && request.destination === 'image',
     new StaleWhileRevalidate({ cacheName: 'classrup-img-v1', plugins: [CacheableResponsePlugin({statuses:[200]}), ExpirationPlugin({maxEntries:200, maxAgeSeconds:2592000, purgeOnQuotaError:true}), privateResponseGuard] }))
4. registerRoute(({url}) => url.pathname.startsWith('/api/') || url.pathname.startsWith('/media/private/'), new NetworkOnly())
5. default: no handler (browser network)
client -> worker: postMessage({ type: 'SKIP_WAITING' }) after the user taps Update
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-114-09.T06 | unit | PS-114-04.R01, PS-114-04.R02 | postMessage of SKIP_WAITING from a controlled client and of an unknown type and from a foreign origin | first accepted, others ignored |
| TEST-PS-114-09.T07 | contract | PS-114-04.R03 | GET_VERSION response | returns { buildId, precacheName, imgEntries } matching the build; no domain events exist for this module |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-UX-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
