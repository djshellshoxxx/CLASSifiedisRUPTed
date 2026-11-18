# PS-114-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_cache. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-114-05.R01 | Cache serves only same-origin requests; cross-origin responses are never cached. | MVP |
| PS-114-05.R02 | Cached data is served to the device's current session only; after logout nothing is served to an unauthenticated page other than public routes. | MVP |
| PS-114-05.R03 | Service worker registration uses the origin scope `/` and is restricted by CSP `worker-src 'self'`. | MVP |
| PS-114-05.R04 | Cache APIs are not exposed to third-party scripts (no third-party script loading, per platform policy). | MVP |

## Data / schema
No capability records. Access is governed by origin and session state.

| Actor | Action | Outcome |
|---|---|---|
| same-origin page, signed in | read cached PUBLIC or REGION_COARSE | ALLOW |
| same-origin page, signed out | read cached PUBLIC | ALLOW |
| same-origin page, signed out | read any authenticated route | DENY (not cached) |
| cross-origin | any | DENY (not cached) |

## Commands / queries / events
None on server.

## States & transitions
Not applicable.

## Validation & errors
Not applicable.

## Authorization
Enforced by service worker scope and server headers (R02 relies on PS-114-02.R03).

## Failure, idempotency, concurrency, offline
Not applicable.

## Privacy, retention, abuse
Cache poisoning mitigated by same-origin rule and hash manifest.

## Observability & budgets
None beyond local counters.

## Tests
- TEST-PS-114-05-01 (integration): cross-origin response not cached.
- TEST-PS-114-05-02 (integration): signed-out page cannot read cached authenticated data.
- TEST-PS-114-05-03 (contract): CSP header includes `worker-src 'self'`.
- TEST-PS-114-05-04 (security): third-party script cannot access cache API (test harness).

## Acceptance criteria
1. Matrix tested in browsers in CI matrix.
2. CSP verified.
3. No cross-origin caching.

## Assumptions & open decisions
- ASSUMPTION: public routes are identified by the route allowlist.
- Security review by Security Lead pending; no audit claimed.
