# PS-024-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_recovery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R07, R08), CTR-COM-001 (R14), CTR-FED-001 (R03), CTR-PRV-001 (R11).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-024-10.R01 | Participant export includes own attestations as original bytes plus parsed view. | MVP |
| PS-024-10.R02 | Attestations are never migrated lossily (CTR-SCH-001 R08); original bytes are retained. | MVP |
| PS-024-10.R03 | Backup restores recovery records, attestations and plan state unchanged. | MVP |
| PS-024-10.R04 | Rollback disables new recoveries only; open recoveries continue to closure. | MVP |
| PS-024-10.R05 | Recovery records are not imported from peers. | MVP |

## Data / schema
Export: `{recoveries: [{record view, attestation_bytes_b64}], schema_version}`.

## Commands / queries / events
Replay rebuilds state; signatures are re-verified on restore.

## States & transitions
Rollback path leaves states unchanged.

## Validation & errors
Unknown MAJOR returns SCH.UNKNOWN_VERSION.

## Authorization
Participant export only.

## Failure, idempotency, concurrency, offline
Restore fails closed if any stored attestation fails re-verification.

## Privacy, retention, abuse
Export omits counterparties' attestations.

## Observability & budgets
Restore verification ≤ 10 ms per attestation (ASSUMPTION).

## Tests
- TEST-PS-024-10-01 (contract): export validates.
- TEST-PS-024-10-02 (restore): tampered attestation fails restore.
- TEST-PS-024-10-03 (rollback): open recoveries close after rollback.

## Acceptance criteria
1. Attestation bytes byte-identical after export and restore.
2. Tampered backup fails closed in 100% of runs.
3. Rollback leaves zero open recoveries stranded.

## Assumptions & open decisions
- PENDING: feature flag for recovery opens (F15 mod_flags).
- PROVISIONAL (D06 default, unapproved).
