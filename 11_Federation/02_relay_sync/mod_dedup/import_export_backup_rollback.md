# PS-087-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_dedup. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (R06), CTR-SCH-001 (R07, R08).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-087-10.R01 | No export of index rows to peers; evidence export only through case process. | MVP |
| PS-087-10.R02 | Index is rebuildable from the event log within 24 h of loss; no restore may accept events that were already rejected. | MVP |
| PS-087-10.R03 | Backups of the index are restored only with the event log to the same point in time. | MVP |

## Data / schema
Rebuild source: committed event log (CTR-EVT-001).

## Commands / queries / events
Rebuild runs as `sys_` job; emits no `dedup.*` events.

## States & transitions
Rebuild moves rows from absent to recorded per PS-087-03.

## Validation & errors
| Code | When |
|---|---|
| DEDUP.REBUILD_INCOMPLETE | rebuild cannot reach horizon start |

## Authorization
Rebuild: Platform Lead approval.

## Failure, idempotency, concurrency, offline
Rebuild idempotent per key.

## Privacy, retention, abuse
Rebuild reads event log only through `sys_`.

## Observability & budgets
Rebuild duration metric; 24 h budget.

## Tests
- TEST-PS-087-10-01 (rebuild): index rebuilt from log equals original for fixture.
- TEST-PS-087-10-02 (restore): stale backup restore with log at later point blocked.

## Acceptance criteria
1. Rebuild equals original.
2. Stale restore blocked.

## Assumptions & open decisions
- ASSUMPTION: 24 h rebuild budget.
