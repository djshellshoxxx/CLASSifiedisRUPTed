# PS-025-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_currency. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R07, R08), CTR-COM-001 (R04), CTR-FED-001 (R03), CTR-PRV-001 (R11).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-025-10.R01 | Participant export includes own bindings with quote hash and amounts as strings, schema 1.0.0. | MVP |
| PS-025-10.R02 | Bindings are never federated or imported from peers. | MVP |
| PS-025-10.R03 | Backup restores bindings and quote hashes unchanged; quote bytes restored as received. | MVP |
| PS-025-10.R04 | Rollback removes the cross-currency option; existing bound terms remain readable and close by cycle rules. | MVP |
| PS-025-10.R05 | Migration of amount fields is lossless or refused (CTR-SCH-001 R08). | MVP |

## Data / schema
Export: `{bindings: [record for requester's slots], schema_version}`.

## Commands / queries / events
Replay rebuilds bindings; quote hashes verified against stored quote bytes on restore.

## States & transitions
Rollback freezes new pins only.

## Validation & errors
Unknown MAJOR returns SCH.UNKNOWN_VERSION.

## Authorization
Participant export only.

## Failure, idempotency, concurrency, offline
Restore fails closed on hash mismatch.

## Privacy, retention, abuse
Export omits counterparties' amounts beyond their own slot per design.

## Observability & budgets
Restore verification ≤ 5 ms per binding (ASSUMPTION).

## Tests
- TEST-PS-025-10-01 (contract): export validates.
- TEST-PS-025-10-02 (restore): altered quote bytes fail restore.
- TEST-PS-025-10-03 (rollback): zero bindings deleted.

## Acceptance criteria
1. Amounts identical after export and restore in fixtures.
2. Hash mismatch on restore fails closed in 100% of runs.
3. Rollback deletes zero rows.

## Assumptions & open decisions
- PENDING: feature flag for cross-currency terms (F15 mod_flags).
- PROVISIONAL (D03 default, unapproved).
