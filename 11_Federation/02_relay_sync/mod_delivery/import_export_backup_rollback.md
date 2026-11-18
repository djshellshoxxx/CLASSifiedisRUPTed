# PS-088-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_delivery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (R07, R13), CTR-SCH-001 (R08).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-088-10.R01 | Queue is not exported. Batch records are exported for audit with IDs and codes only. | MVP |
| PS-088-10.R02 | Queue restore after data loss rebuilds rows from the event log for events not yet acknowledged by a peer; acknowledged rows are not resent. | MVP |
| PS-088-10.R03 | Rollback of a batch is not possible; compensation is a new event by origin (tombstone, CTR-FED-001 R07). | MVP |

## Data / schema
Batch export `dlv.export@1.0.0` (PENDING registration).

## Commands / queries / events
`delivery.rebuild_queue` (sys_), `dlv.exported`.

## States & transitions
Rebuild creates rows in `queued` only.

## Validation & errors
| Code | When |
|---|---|
| DELIVERY.REBUILD_UNCERTAIN | ack state unknown for a row; row set to queued and receiver dedupe applies |

## Authorization
Rebuild: Platform Lead approval.

## Failure, idempotency, concurrency, offline
Rebuild idempotent; receiver dedupe prevents double apply.

## Privacy, retention, abuse
Exports contain no payloads.

## Observability & budgets
`delivery_rebuilds_total`.

## Tests
- TEST-PS-088-10-01 (restore): acknowledged rows not resent.
- TEST-PS-088-10-02 (rebuild): unknown-ack rows resent and deduped.

## Acceptance criteria
1. No duplicate application after restore.

## Assumptions & open decisions
- ASSUMPTION: rebuild relies on receiver dedupe.
