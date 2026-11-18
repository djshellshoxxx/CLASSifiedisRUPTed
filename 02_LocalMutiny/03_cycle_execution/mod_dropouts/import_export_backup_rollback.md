# PS-022-10 — Import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_dropouts. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-022-10.R01 | Export: a participant receives own dropout involvement (own withdrawals, cases where they were a party) with outcome, no reporter identity. | MVP |
| PS-022-10.R02 | Import of dropout cases from federated peers is not accepted in MVP. | MVP |
| PS-022-10.R03 | Restore of a backup does not reopen RESOLVED_* cases; reconciliation runs against mod_lock state before serving. | MVP |
| PS-022-10.R04 | Rollback keeps 1.0.0 rows readable. | MVP |

## Data / schema
Export JSON: `dropout_id`, `cycle_id`, `proposal_version`, `reason_code`, `resolution`, `opened_at`, `resolved_at`. Reporter fields excluded.

## Commands / queries / events
`cyc.dropout.export` (`self`, idempotent by export ID).

## States & transitions
Restore reconciliation maps each case to a valid state; invalid combinations are quarantined with `CYC_DROPOUT.RESTORE_INCONSISTENT` (non-retryable).

## Validation & errors
Imports return `SYS.FORBIDDEN` in MVP.

## Authorization
Export by `self`; restore by dual-control operator (CTR-CAP-001 R07).

## Failure, idempotency, concurrency, offline
RPO 15 min, RTO 4 h (ASSUMPTION). Restore drill confirms no resurrected HELD locks.

## Privacy, retention, abuse
Exports encrypted; expire after 7 days (ASSUMPTION). Backups follow PS-022-07 retention.

## Observability & budgets
Export p95 ≤ 30 s for 10 000 rows.

## Tests
- TEST-PS-022-10-01 (integration): export excludes reporter identity.
- TEST-PS-022-10-02 (restore): RESOLVED_CANCELLED stays cancelled after restore.
- TEST-PS-022-10-03 (rollback): 1.0.0 rows readable after drill.

## Acceptance criteria
1. Export contains no reporter identifiers.
2. Restore drill zero resurrected cases.
3. Rollback drill zero data loss.

## Assumptions & open decisions
- ASSUMPTION: RPO/RTO and export expiry.
- [DECISIONS.md](../../../DECISIONS.md) D07 — PROVISIONAL (D07 default, unapproved).
