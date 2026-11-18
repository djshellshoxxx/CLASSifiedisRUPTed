# PS-023-10 — Import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_lock. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-023-10.R01 | Export: a participant's own lock rows for their cycles (item ID, fence, state, expiry). No other party's owner ID. | MVP |
| PS-023-10.R02 | Locks are never imported from federated peers; reservations are local to the instance that holds the item (FUTURE review under CTR-FED-001). | MVP |
| PS-023-10.R03 | Restore: HELD locks whose `expires_at` has passed are set EXPIRED before serving; no HELD lock survives restore without a live cycle. | MVP |
| PS-023-10.R04 | Rollback keeps 1.0.0 rows readable. | MVP |

## Data / schema
Export JSON mirrors `item_lock` minus other parties' `owner_party_id`.

## Commands / queries / events
`cyc.lock.export` (`self`, idempotent by export ID).

## States & transitions
Restore reconciliation: HELD with expired TTL → EXPIRED; HELD with missing cycle → RELEASED (reason `restore_orphan`).

## Validation & errors
Import returns `SYS.FORBIDDEN`. Restore inconsistency: `CYC_LOCK.RESTORE_INCONSISTENT` (non-retryable), quarantined.

## Authorization
Export by `self`; restore by dual-control operator.

## Failure, idempotency, concurrency, offline
RPO 15 min, RTO 4 h (ASSUMPTION). Restore re-computes the unique-index invariant before accepting traffic.

## Privacy, retention, abuse
Exports encrypted, 7-day expiry (ASSUMPTION).

## Observability & budgets
Restore reconciliation duration ≤ 5 min for 1 million lock rows (ASSUMPTION).

## Tests
- TEST-PS-023-10-01 (integration): export excludes other owners.
- TEST-PS-023-10-02 (restore): expired HELD becomes EXPIRED after restore.
- TEST-PS-023-10-03 (rollback): 1.0.0 readable after rollback drill.

## Acceptance criteria
1. Export contains no other party's owner IDs.
2. Restore drill: zero HELD locks without live cycle.
3. Rollback drill: zero data loss.

## Assumptions & open decisions
- ASSUMPTION: RPO/RTO and reconciliation budget.
- [DECISIONS.md](../../../DECISIONS.md) D07 — PROVISIONAL (D07 default, unapproved).
