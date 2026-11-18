# PS-119-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_storage. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R03), CTR-EVT-001 (R03), CTR-PRV-001 (R06).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-119-06.R01 | Object write is durable (fsync or provider ack) before the row becomes PENDING_SCAN. | MVP |
| PS-119-06.R02 | Orphan objects (no row after 24 h, ASSUMPTION) are removed by sweeper; rows without object are marked QUARANTINED. | MVP |
| PS-119-06.R03 | Object store timeouts: write 15 s, read 5 s (ASSUMPTION). | MVP |
| PS-119-06.R04 | Upload retried by client with same `client_upload_id` is idempotent (PS-119-04). | MVP |

## Data / schema
No new fields. Sweeper uses `created_at` and state.

## Commands / queries / events
None new.

## States & transitions
Write path: REQUESTED → OBJECT_WRITTEN → ROW_COMMITTED (PENDING_SCAN). Failure after object write but before row commit leaves an orphan, reclaimed by sweeper.

## Validation & errors
| Situation | Code | Category | Retryable |
|---|---|---|---|
| Object store unavailable | STO.STORE_UNAVAILABLE | unavailable | true (retry_after_ms) |
| Write timeout | STO.STORE_TIMEOUT | unavailable | true |
| Checksum mismatch on read | STO.CHECKSUM_MISMATCH | internal | false (alert) |

## Authorization
Sweeper and repair are `sys_` actions; manual repair is `ope_` with dual control.

## Failure, idempotency, concurrency, offline
Concurrent uploads with same key: unique index on (owner_ref, client_upload_id) decides; loser gets the winner's blob_id. Read checksum verified against `sha256` on each cache miss.

## Privacy, retention, abuse
Orphan cleanup deletes bytes without logging content identifiers beyond counts.

## Observability & budgets
Metrics `stored_orphans_reclaimed_total`, `stored_checksum_mismatch_total`. Alert on any checksum mismatch.

## Tests
- TEST-PS-119-06-01 (chaos): kill process after object write; sweeper reclaims orphan within 24 h test clock.
- TEST-PS-119-06-02 (integration): object store timeout returns STO.STORE_TIMEOUT.
- TEST-PS-119-06-03 (integration): corrupt object triggers checksum mismatch and quarantine.

## Acceptance criteria
1. Zero orphan objects older than 24 h after sweep.
2. Checksum mismatch never served to clients.
3. Duplicate concurrent upload yields one row.

## Assumptions & open decisions
- ASSUMPTION: timeouts and orphan window.
- D08 PROVISIONAL (unapproved): offline upload retries follow client queue rules.
