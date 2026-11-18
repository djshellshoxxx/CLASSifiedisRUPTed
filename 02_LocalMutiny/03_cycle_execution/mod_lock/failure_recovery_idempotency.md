# PS-023-06 — Failure, recovery, idempotency and concurrency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_lock. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-023-06.R01 | Acquisition of a set is atomic from the caller's view: either all items HELD or none. | MVP |
| PS-023-06.R02 | Two cycles racing for the same item: exactly one wins; the loser receives `CYC_LOCK.ITEM_UNAVAILABLE` within 200 ms. | MVP |
| PS-023-06.R03 | Crash after partial acquisition: reconciler releases orphan REQUESTED rows within 60 s. | MVP |
| PS-023-06.R04 | Expiry timer fires at-least-once; `expire` is idempotent on (`lock_id`, `fence`). | MVP |
| PS-023-06.R05 | Stale holder (old fence) cannot release or consume a newer lock. | MVP |

## Data / schema
Uses `fence` and `revision` from [domain_schema.md](domain_schema.md). Idempotency table `lck_idem` (24 h).

## Commands / queries / events
Retries use the same `idempotency_key`; events keep original `correlation_id`.

## States & transitions
Recovery moves REQUESTED → RELEASED only; HELD never moves back to REQUESTED.

## Validation & errors
| Code | Retryable | Class | Notes |
|---|---|---|---|
| CYC_LOCK.ITEM_UNAVAILABLE | true | conflict / 409 | retry only after cycle re-consent |
| CYC_LOCK.STALE_FENCE | false | conflict / 409 | re-read lock |
| SYS.UNAVAILABLE | true | unavailable / 503 | backoff 1 s to 30 s, jitter ±20 % |
| CYC_LOCK.ACQUIRE_TIMEOUT | true | unavailable / 503 | lock acquisition > 2 s |

## Authorization
Re-check at commit (CTR-CAP-001 R09).

## Failure, idempotency, concurrency, offline
Deadlock avoided by R03 of PS-023-03 (ascending order). Lock TTL expiry is server-clock only. Database failover: unique index guarantees no double HELD; fence continues from persisted max.

## Privacy, retention, abuse
Logs contain lock IDs and fences only.

## Observability & budgets
Metrics: `lock_contention_total`, `lock_orphan_swept_total`. Alert when orphan sweep > 0 for 10 min.

## Tests
- TEST-PS-023-06-01 (concurrency): 1 000 racing acquires on one item → one HELD.
- TEST-PS-023-06-02 (fault injection): kill after 4 of 8 items; reconciler releases remaining 4 within 60 s.
- TEST-PS-023-06-03 (fencing): stale fence release rejected.

## Acceptance criteria
1. Zero double-HELD under race test.
2. Orphan sweep within 60 s in fault test.
3. Stale fence never accepted.

## Assumptions & open decisions
- ASSUMPTION: 60 s orphan threshold; 2 s acquisition timeout.
- [DECISIONS.md](../../../DECISIONS.md) D04 — PROVISIONAL (D04 default, unapproved): locks reserve items; they do not guarantee transfer.
