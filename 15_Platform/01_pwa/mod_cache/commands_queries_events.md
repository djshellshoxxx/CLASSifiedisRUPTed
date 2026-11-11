# PS-114-04 — Commands, queries and events: PWA caching

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M02 PWA caching](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/cache` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-114-04.R01** The module exposes no vault commands, relay commands or queries; its interface is the fetch event routing table and the postMessage messages SKIP_WAITING {nonce}, GET_VERSION, BIND_PARTITION {partition, relayOrigins} and CLEAR_USER_CACHES {reason, partition}.
- **PS-114-04.R02** Messages are accepted only from same-origin window clients, SKIP_WAITING only with a valid nonce, and unknown message types are ignored.
- **PS-114-04.R03** The module produces no domain events and consumes none; version and cache status are available to the page through GET_VERSION.
- **PS-114-04.R04** Public media is read only from the F15.S02.M01 route GET /media/v1/sha256-<base64url>, which serves P0 F15.S02.M03 blobs with Cache-Control public, max-age=31536000, immutable, Access-Control-Allow-Origin for allowlisted PWA origins and no Set-Cookie, outside the command bus's no-store policy.

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
| PLATFORM_CACHE_PRIVATE_RESPONSE | 422 | no | a relay command, private or vault response would be cached |
| PLATFORM_CACHE_UNCACHEABLE | 422 | no | response failed cacheability checks and is not stored |
| PLATFORM_CACHE_VERSION_MISMATCH | 409 | no | cache name not on the allowlist for this build and deleted at activation |
| PLATFORM_CACHE_DIGEST_MISMATCH | 502 | yes | media bytes do not hash to the requested content address; discarded, not shown, next relay tried |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Service worker module without vault commands, relay commands or queries. Interface: fetch routing table plus postMessage messages GET_VERSION (returns { buildId, releaseSeq, precacheName, imgEntries, nonce } where a waiting worker issues a one-time nonce), SKIP_WAITING { nonce } (activate this waiting worker), BIND_PARTITION { partition, relayOrigins } (sent after unlock; origins kept in memory only), CLEAR_USER_CACHES { reason: lock|principal_switch|erase, partition } (unbind, or delete on erase).

### Example

```
// sw.ts routing table (order matters)
1. precacheAndRoute(self.__WB_MANIFEST)                               // app shell, hashed assets
2. NavigationRoute(createHandlerBoundToURL('/index.html'), { denylist: [/^\/__media\//, /^\/\.well-known\//] })
3. registerRoute(({url}) => url.origin === self.location.origin && url.pathname.startsWith('/__media/sha256-'),
     verifiedMediaHandler({ cacheName: () => `classrup-img-v1-${boundPartition}`, relayOrigins: () => boundRelayOrigins,
       fetchInit: { mode: 'cors', credentials: 'omit' }, verify: sha256MatchesPath, plugins: [CacheableResponsePlugin({statuses:[200]}),
       ExpirationPlugin({maxEntries:200, maxAgeSeconds:2592000, purgeOnQuotaError:true}), privateResponseGuard] }))
     // miss: GET https://<relay>/media/v1/sha256-<b64> per bound origin; body hashed; mismatch -> discard, count, next relay
4. registerRoute(({url}) => boundRelayOrigins.includes(url.origin), new NetworkOnly())   // relay commands, mailbox, private media
5. default: no handler (browser network)
page: <img src="/__media/sha256-Qm3...">; without a controlling worker the page fetches with mode cors, credentials omit (the equivalent of crossorigin=anonymous), verifies and renders a blob: URL
CSP (page): img-src 'self' blob: data:; connect-src 'self' https:  (relay origins are user-selected; the allowlist is enforced in code)
client -> waiting worker: GET_VERSION -> { buildId, nonce }; after the user taps Update: postMessage({ type: 'SKIP_WAITING', nonce })
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-114-09.T06 | unit | PS-114-04.R01, PS-114-04.R02 | postMessage of each message type from a controlled client, an unknown type and from a foreign origin | documented effect for known types; others ignored |
| TEST-PS-114-09.T07 | contract | PS-114-04.R03 | GET_VERSION response from active and waiting workers | returns { buildId, releaseSeq, precacheName, imgEntries } and a nonce only from the waiting worker; no domain events exist for this module |
| TEST-PS-114-09.T21 | abuse | PS-114-04.R02, PS-114-02.R04 | page script posts SKIP_WAITING with no nonce, an expired nonce, a used nonce and a nonce from another waiting worker | all ignored with FORBIDDEN counted; the waiting worker stays waiting |
| TEST-PS-114-09.T22 | integration | PS-114-01.R04, PS-114-04.R04 | img1 fetched from r1, then the same content address requested while only r2 (honest) is bound and then offline | second and third requests served from the cache entry keyed by content address without contacting a relay; r1 response headers match the F15.S02.M01 media contract |

## Dependencies

Module depends on: F15.S02.M01, F15.S02.M03, CTR-CAP-001, CTR-ID-001, CTR-OBS-001, CTR-PRV-001, CTR-UX-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
