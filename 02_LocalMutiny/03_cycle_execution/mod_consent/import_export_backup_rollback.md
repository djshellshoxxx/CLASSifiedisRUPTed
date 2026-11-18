# PS-021-10 — Import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_consent. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-021-10.R01 | Export of a participant's consent rows: own rows only, schema 1.0.0, no other parties' IDs. | MVP |
| PS-021-10.R02 | Consent rows are not imported from federated peers in MVP; federation of consent is deferred (FUTURE). | FUTURE |
| PS-021-10.R03 | Backup restore never resurrects a WITHDRAWN or EXPIRED row as ACCEPTED; restore runs a state reconciliation. | MVP |
| PS-021-10.R04 | Rollback of a schema version keeps rows readable under 1.0.0. | MVP |

## Data / schema
Export file: JSON array of objects matching `cycle_consent` fields, minus `party_id` of counterparties (none present) and `consent_record_ref` expanded only to F10 export.

## Commands / queries / events
`cyc.consent.export` (capability `cyc.export`, scope `self`), idempotent by export ID.

## States & transitions
Restore reconciliation maps each row to the state machine; invalid combinations are quarantined, not auto-corrected.

## Validation & errors
Import is not supported in MVP; any import attempt returns `SYS.FORBIDDEN`. Restore validation errors: `CYC_CONSENT.RESTORE_INCONSISTENT`, retryable false.

## Authorization
Export by `self` only; operator restore requires dual control (CTR-CAP-001 R07).

## Failure, idempotency, concurrency, offline
Backups taken at 15-minute intervals (ASSUMPTION); RPO 15 min, RTO 4 h. Rollback to previous release does not drop the `cycle_consent` table.

## Privacy, retention, abuse
Exports are encrypted at rest and expire after 7 days (ASSUMPTION). Backups follow the 90-day retention of PS-021-07.

## Observability & budgets
Export job duration p95 ≤ 30 s for 10 000 rows (ASSUMPTION).

## Tests
- TEST-PS-021-10-01 (integration): export contains own rows only.
- TEST-PS-021-10-02 (restore): restore of a WITHDRAWN row yields WITHDRAWN.
- TEST-PS-021-10-03 (rollback): 1.0.0 rows readable after rollback drill.

## Acceptance criteria
1. Export excludes counterparty identifiers.
2. Restore drill passes reconciliation with zero resurrected consents.
3. Rollback drill passes with no data loss.

## Assumptions & open decisions
- ASSUMPTION: RPO/RTO and export expiry values.
- [DECISIONS.md](../../../DECISIONS.md) D07 — PROVISIONAL (D07 default, unapproved): exports and backups follow retention defaults.
