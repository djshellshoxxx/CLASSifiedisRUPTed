# PS-114-09 — Contract and acceptance tests: PWA caching

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M02 PWA caching](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/cache` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-114-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-114-09.R02** Routing, cacheability and verification logic is unit tested as pure functions, and lifecycle and offline behavior is tested in real browsers with Playwright.
- **PS-114-09.R03** Tests assert the negative property that no relay command, vault or private response ever reaches Cache Storage and no unverified image is ever shown.

## Specification

See the module test table below (all processes).

**Fixtures:** Built PWA served by a static server on :4173 plus stub relays r1 on :8787 and r2 on :8788 with /api/v1/q/bazaar.listing.get (relay access token required), /media/v1/sha256-<b64> for img1.webp (r1 honest, r2 optionally lying), /mailbox/v1/m1; two builds A and B with different buildId and releaseSeq; principals P1 and P2 sharing one browser profile; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-114-09.T01 | unit | PS-114-01.R01, PS-114-01.R02, PS-114-01.R03 | routing table evaluated for 30 sample URLs (shell, /__media/ path, relay media, relay command, mailbox, cross-origin) | each URL maps to the documented strategy and cache name |
| TEST-PS-114-09.T02 | unit | PS-114-02.R02, PS-114-02.R03 | cacheability and verification over responses with private, no-store, Set-Cookie, Vary Authorization, 404, text/html, 6 MiB, wrong digest | only 200 image responses without private markers whose digest matches return true; others yield PLATFORM_CACHE_UNCACHEABLE or PLATFORM_CACHE_DIGEST_MISMATCH |
| TEST-PS-114-09.T03 | integration | PS-114-02.R01 | CI build with manifest enlarged to 1.6 MiB and a relay-origin URL injected | build fails with PLATFORM_CACHE_PRECACHE_BUDGET and PLATFORM_CACHE_PRIVATE_RESPONSE |
| TEST-PS-114-09.T04 | e2e | PS-114-03.R01, PS-114-03.R02, PS-114-03.R03 | install build A, then deploy build B, tab remains open | B stays waiting until SKIP_WAITING with B's nonce after consent; after activation only B caches remain |
| TEST-PS-114-09.T05 | integration | PS-114-03.R02 | worker B installed with a failing precache entry | install aborted, A keeps serving, no partial cache of B remains |
| TEST-PS-114-09.T06 | unit | PS-114-04.R01, PS-114-04.R02 | postMessage of each message type from a controlled client, an unknown type and from a foreign origin | documented effect for known types; others ignored |
| TEST-PS-114-09.T07 | contract | PS-114-04.R03 | GET_VERSION response from active and waiting workers | returns { buildId, releaseSeq, precacheName, imgEntries } and a nonce only from the waiting worker; no domain events exist for this module |
| TEST-PS-114-09.T08 | abuse | PS-114-05.R01, PS-114-05.R02, PS-114-07.R01 | unlock vault, call a relay query with a relay access token, open a mailbox and private media, then inspect all Cache Storage keys | no relay command, mailbox or private media entry and no Authorization-bearing request cached; no vault data in Cache Storage |
| TEST-PS-114-09.T09 | abuse | PS-114-05.R03, PS-114-07.R02 | P1 views 5 images, vault locks; P2 unlocks and views 2; P1 unlocks and runs Erase vault | after lock P1's partition is not served; P2 sees only its own 2 entries; erase deletes P1's partition; P2's partition intact |
| TEST-PS-114-09.T10 | e2e | PS-114-06.R01, PS-114-06.R03 | first visit online then go offline and open a deep link /l/abc | shell renders, relay calls show offline state, no browser error page |
| TEST-PS-114-09.T11 | integration | PS-114-06.R02, PS-114-06.R01 | simulate QuotaExceededError on cache put and a slow image request | response still delivered; cache write error counted; no unhandled rejection |
| TEST-PS-114-09.T12 | integration | PS-114-07.R03, PS-114-07.R02 | media route fed a cross-origin opaque response and a 6 MiB image | neither is stored |
| TEST-PS-114-09.T13 | load | PS-114-08.R03, PS-114-08.R02 | Lighthouse CI on Moto G-class 4G profile with warm and cold cache | LCP ≤ 2.5 s, precache within budget, initial JS ≤ 150 KiB gzip |
| TEST-PS-114-09.T14 | integration | PS-114-08.R01 | run an offline session with 10 image hits and watch network traffic | local counters updated, no telemetry request is made, counters contain no URLs or identifiers |
| TEST-PS-114-09.T15 | unit | PS-114-09.R01 | traceability tool run | every PS-114 requirement maps to a passing test |
| TEST-PS-114-09.T16 | e2e | PS-114-09.R02, PS-114-09.R03 | Playwright suite on Chromium, WebKit, Firefox | all service worker tests pass on each engine |
| TEST-PS-114-09.T17 | integration | PS-114-10.R01, PS-114-10.R02 | roll back to build A after B activated | cache cleanup removes B caches, app loads, no user data lost |
| TEST-PS-114-09.T18 | abuse | PS-114-07.R04, PS-114-02.R02, PS-114-09.R03 | stub relay r2 returns different bytes for img1's content address, first with no worker and then with the worker | image neither cached nor displayed, neutral image frame shown, digest_mismatch counted; r1 then supplies the correct bytes which are cached once under the content-address key |
| TEST-PS-114-09.T19 | e2e | PS-114-10.R03, PS-114-03.R04 | kill file names active build B with knownGood A; then a kill file names B with no knownGood | within one update check B's caches are deleted and A activates; in the second case the worker unregisters and all classrup- caches are deleted; IndexedDB vault untouched in both |
| TEST-PS-114-09.T20 | integration | PS-114-07.R02, PS-114-03.R04 | 201 distinct images viewed, then clock advanced 31 days and 3 new images viewed | at most 200 entries after the first step; after the advance only the 3 fresh entries remain |
| TEST-PS-114-09.T21 | abuse | PS-114-04.R02, PS-114-02.R04 | page script posts SKIP_WAITING with no nonce, an expired nonce, a used nonce and a nonce from another waiting worker | all ignored with FORBIDDEN counted; the waiting worker stays waiting |
| TEST-PS-114-09.T22 | integration | PS-114-01.R04, PS-114-04.R04 | img1 fetched from r1, then the same content address requested while only r2 (honest) is bound and then offline | second and third requests served from the cache entry keyed by content address without contacting a relay; r1 response headers match the F15.S02.M01 media contract |

## Acceptance criteria

- All tests T01-T22 pass in CI.
- After first visit the app shell opens offline in under 2.5 s LCP on a Moto G-class 4G profile.
- No relay command response, vault data or private media is ever present in Cache Storage, and no image whose bytes fail content-address verification is ever cached or shown (abuse suite T08, T09, T18).
- A new release never takes control without user consent while a client is open, except a known-good replacement ordered by the kill file.

## Dependencies

Module depends on: F15.S02.M01, F15.S02.M03, CTR-CAP-001, CTR-ID-001, CTR-OBS-001, CTR-PRV-001, CTR-UX-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
