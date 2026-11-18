# PS-114-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_cache. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-114-02.R01 | Only `GET` requests with 200 status are cached. | MVP |
| PS-114-02.R02 | Cacheable classes: `PUBLIC` (listing pages, category data) and `REGION_COARSE` (region-cell listing only). | MVP |
| PS-114-02.R03 | A response is not cached if it has `Cache-Control` containing `private` or `no-store`, `Set-Cookie`, or if the request has an `Authorization` header. | MVP |
| PS-114-02.R04 | Precache entries are accepted only if the SHA-256 matches the manifest. | MVP |
| PS-114-02.R05 | Response `Content-Type` must be the expected type for the route; mismatches are not cached. | MVP |

## Data / schema
| Check | Rule | Client error code | Retryable | message_key |
|---|---|---|---|---|
| method/status | R01 | CACHE.NOT_CACHEABLE | false | n/a (silent) |
| class | R02 | CACHE.CLASS_NOT_ALLOWED | false | n/a (silent) |
| headers | R03 | CACHE.NOT_CACHEABLE | false | n/a (silent) |
| sha256 | R04 | CACHE.MANIFEST_MISMATCH | true | err.cache.manifest_mismatch |
| content type | R05 | CACHE.NOT_CACHEABLE | false | n/a (silent) |

## Commands / queries / events
Validation happens at write time into the cache; rejected responses are still returned to the page.

## States & transitions
Not applicable.

## Validation & errors
Client-only errors; they are logged locally with code and never sent to server.

## Authorization
Not applicable; see authorization_capabilities.

## Failure, idempotency, concurrency, offline
Deterministic checks; repeated writes overwrite the same key.

## Privacy, retention, abuse
Rejected responses are discarded, not stored in diagnostics.

## Observability & budgets
Count per rejection code (local only).

## Tests
- TEST-PS-114-02-01 (unit): `Cache-Control: private` response is not cached.
- TEST-PS-114-02-02 (unit): request with `Authorization` header is not cached.
- TEST-PS-114-02-03 (unit): precache file with wrong hash causes manifest mismatch.
- TEST-PS-114-02-04 (negative): `POST` response is never stored.

## Acceptance criteria
1. Each rule has passing and failing fixture.
2. No private response is ever cached in the fixture suite.
3. Mismatch triggers update retry, not activation.

## Assumptions & open decisions
- ASSUMPTION: cacheable route list maintained with the API catalog.
- No Dxx blocks validation.
