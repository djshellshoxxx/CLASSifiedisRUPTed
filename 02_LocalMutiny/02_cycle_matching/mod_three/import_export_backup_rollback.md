# PS-020-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_three. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R05–R09), CTR-FED-001 (R03), CTR-PRV-001 (R11).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-020-10.R01 | Participant export includes own three-party cycles (all versions), schema 1.0.0. | MVP |
| PS-020-10.R02 | Three-party cycles are not federated or imported from peers in MVP. | MVP |
| PS-020-10.R03 | Backup restores cycles with version and consent flags unchanged. | MVP |
| PS-020-10.R04 | Rollback disables new proposals; existing cycles remain readable and close by rule. | MVP |

## Data / schema
Export: `{cycles: [record for requester's slots], schema_version}`.

## Commands / queries / events
Replay of `cycle.*` events rebuilds state.

## States & transitions
Rollback freezes proposals only.

## Validation & errors
Unknown MAJOR returns SCH.UNKNOWN_VERSION.

## Authorization
Participant export only.

## Failure, idempotency, concurrency, offline
Restore replays in revision order; gaps block restore.

## Privacy, retention, abuse
Export omits other slots' wants text.

## Observability & budgets
Export ≤ 32 KB per participant (ASSUMPTION).

## Tests
- TEST-PS-020-10-01 (contract): export validates.
- TEST-PS-020-10-02 (restore): backup restore preserves versions.
- TEST-PS-020-10-03 (rollback): zero cycle rows deleted.

## Acceptance criteria
1. Restore reproduces cycles exactly in fixtures.
2. No three-party cycle appears in federation output.
3. Rollback deletes zero rows.

## Assumptions & open decisions
- PENDING: feature flag for three-party matching (F15 mod_flags).
- PROVISIONAL (D02 default, unapproved).
