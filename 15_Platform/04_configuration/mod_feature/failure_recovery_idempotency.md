# PS-123-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/04_configuration/mod_feature (F15.S04.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-123-06.R01 | Definition catalog is versioned; the last valid catalog is served if the store is unavailable (fail to last-known-good). | MVP |
| PS-123-06.R02 | A bad definition push is rejected whole; no partial catalog is applied. | MVP |
| PS-123-06.R03 | Deprecation sets dependent flags off before the feature is marked `deprecated` (ordering, PS-123-03). | MVP |
| PS-123-06.R04 | Commands are retried with the same key; timeout is unknown outcome and resolved by reading the lifecycle state. | MVP |

## Data / schema
Catalog snapshot: digest of sorted definitions; stored with version.

## Commands / queries / events
Retry-safe per PS-123-04.

## States & transitions
Not applicable beyond PS-123-03.

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| FEATURE.CATALOG_STALE | true | unavailable / 503 | Store down; last-known-good served. |
| FEATURE.DEFINITION_INVALID | false | validation / 400 | Bad push. |

## Authorization
Not applicable at runtime.

## Failure, idempotency, concurrency, offline
Clients cache the catalog snapshot offline; they use it read-only (PS-124 R09).

## Privacy, retention, abuse
Not applicable.

## Observability & budgets
Alert when catalog age > 15 min on any node (ASSUMPTION).

## Tests
- TEST-PS-123-06-01 (fault): store down; nodes serve last-known-good.
- TEST-PS-123-06-02 (integration): partial bad catalog rejected whole.
- TEST-PS-123-06-03 (integration): deprecation ordering verified.
- TEST-PS-123-06-04 (unit): retry after timeout reads state before re-sending.

## Acceptance criteria
1. No partial catalog applied (TEST-02).
2. TEST-PS-123-06-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 15-minute catalog staleness alert.
