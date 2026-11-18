# PS-019-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_party. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R05–R09), CTR-FED-001 (R03), CTR-PRV-001 (R11).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-019-10.R01 | Participant export includes their own bindings (all cycles) in schema 1.0.0. | MVP |
| PS-019-10.R02 | Bindings are not imported from peers in MVP. | MVP |
| PS-019-10.R03 | Backup restores bindings with status and version unchanged; live-slot constraint is re-verified on restore. | MVP |
| PS-019-10.R04 | Rollback stops new binds; existing live bindings remain readable and are closed by cycle rules, never deleted. | MVP |

## Data / schema
Export: `{bindings: [binding record for requester], schema_version}`.

## Commands / queries / events
Replay of `cycle.slot_*` events rebuilds bindings.

## States & transitions
Rollback freezes new bindings only.

## Validation & errors
Unknown MAJOR returns SCH.UNKNOWN_VERSION.

## Authorization
Export by participant (self) only.

## Failure, idempotency, concurrency, offline
Restore fails closed if any participant has two live slots (CYCPARTY.SLOT_TAKEN on replay).

## Privacy, retention, abuse
Export omits other participants' refs.

## Observability & budgets
Restore check ≤ 5 s for 100,000 bindings (ASSUMPTION).

## Tests
- TEST-PS-019-10-01 (contract): export validates.
- TEST-PS-019-10-02 (restore): duplicate live slot in backup blocks restore.
- TEST-PS-019-10-03 (rollback): zero binding rows deleted.

## Acceptance criteria
1. Restore reproduces bindings exactly in fixtures.
2. Restore with a double-booked backup fails closed in 100% of runs.
3. Rollback deletes zero rows.

## Assumptions & open decisions
- PENDING: feature flag for cycle matching (F15 mod_flags).
- PROVISIONAL (D04 default, unapproved).
