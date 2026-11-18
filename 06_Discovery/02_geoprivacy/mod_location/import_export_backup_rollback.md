# PS-048-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_location. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06, R11, R12), CTR-SCH-001 (R07, R08); PENDING CTR-DSC-001.

**Decision labels:** Export inclusion of stored cell PROVISIONAL (D07 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-048-10.R01 | User export includes the stored cell with source and set_at (LOCATION_COARSE allowed in own export). | MVP |
| PS-048-10.R02 | Export never includes coordinates (none stored) or device consent internals beyond consent ID. | MVP |
| PS-048-10.R03 | Backups include stored cells (RET-ACC); deletion replays on restore (CTR-PRV-001 R06). | MVP |
| PS-048-10.R04 | Import of a cell from another system is not supported in MVP. | MVP |
| PS-048-10.R05 | Rollback of cell-set schema changes uses migration hooks (CTR-SCH-001 R07); stored bytes not rewritten. | MVP |

## Data / schema
Export bundle entry: `{region_cell, source, set_at}`. Deletion record per CTR-PRV-001 R12.

## Commands / queries / events
No import path.

## States & transitions
Restore: deleted accounts remain cleared after restore.

## Validation & errors
Restore of an account deleted after backup → `LOCATION.DELETION_REPLAYED` internal.

## Authorization
Export by owner only.

## Failure, idempotency, concurrency, offline
Export job idempotent by export ID.

## Privacy, retention, abuse
Exported cell is the user's own data; no counterparties.

## Observability & budgets
Export size and count only.

## Tests
- TEST-PS-048-10-01 (integration): export contains cell and no coordinate keys.
- TEST-PS-048-10-02 (integration): restore after deletion does not resurrect cell.
- TEST-PS-048-10-03 (contract): migration golden fixtures.

## Acceptance criteria
1. Export fixture check passes.
2. Restore-after-deletion test passes.

## Assumptions & open decisions
- D07 PROVISIONAL.
