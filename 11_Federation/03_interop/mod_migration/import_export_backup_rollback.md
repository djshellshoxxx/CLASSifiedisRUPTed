# PS-090-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_migration. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R07, R08), CTR-FED-001 (R08, R09), CTR-PRV-001 (R11).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-090-10.R01 | Before execute, a full backup of affected stores is verified by restore test on a copy (ASSUMPTION). | MVP |
| PS-090-10.R02 | Rollback restores prior version pointers and keeps original bytes; new derived views are discarded. | MVP |
| PS-090-10.R03 | Interop export of migration reports is content-free (PS-090-07). Migrated node data exports use CTR-PRV-001 R11 rules. | MVP |
| PS-090-10.R04 | Import of another node's migration plan is refused; plans are node-local. | MVP |

## Data / schema
Backup manifest `migrate.backup@1.0.0` (PENDING registration).

## Commands / queries / events
`migration.rollback` (see [commands_queries_events.md](commands_queries_events.md)).

## States & transitions
Rollback from `completed` or `failed` per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
| Code | When |
|---|---|
| MIGRATE.BACKUP_UNVERIFIED | restore test not passed before execute |
| MIGRATE.ROLLBACK_WINDOW_CLOSED | after deadline |

## Authorization
Rollback: two approvers. Backup verification: Platform Lead.

## Failure, idempotency, concurrency, offline
Rollback idempotent per run; restore test idempotent per backup digest.

## Privacy, retention, abuse
Backups follow platform schedule; restore does not extend retention.

## Observability & budgets
`migrate_rollbacks_total`; rollback duration ≤ 1 h for fixture (ASSUMPTION).

## Tests
- TEST-PS-090-10-01 (backup): execute refused without verified backup.
- TEST-PS-090-10-02 (rollback): prior pointers restored; original bytes unchanged.
- TEST-PS-090-10-03 (node): cross-node plan import refused.

## Acceptance criteria
1. No execute without verified backup.
2. Rollback leaves bytes unchanged.

## Assumptions & open decisions
- ASSUMPTION: backup verification gate; rollback time budget.
- PROVISIONAL (D10 default, unapproved): keys in migration plans are referenced by ID, never by value.
