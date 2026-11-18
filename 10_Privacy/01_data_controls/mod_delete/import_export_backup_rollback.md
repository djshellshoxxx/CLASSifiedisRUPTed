# PS-077-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_delete (Privacy Lead, F10; backup owner F15.S03.M02 mod_backups). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06 backup replay, R07 holds), CTR-FED-001 (R07 tombstones), CTR-SCH-001 (R08 migration of signed records).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-077-10.R01 | Deletion requests and completion records are included in data exports as metadata only (dates and counts), never as deleted content. | MVP |
| PS-077-10.R02 | Backups taken before a deletion are restored only after replay of that deletion ledger (PS-077-06 R04). | MVP |
| PS-077-10.R03 | Rollback of a deployment that changes deletion logic cannot resurrect deleted targets; migration is forward-only for `deletion_replay`. | MVP |
| PS-077-10.R04 | Imports of federated data cannot re-introduce a target with a tombstone (CTR-FED-001 R07 `FED.TOMBSTONE_ON_ARRIVAL`). | MVP |
| PS-077-10.R05 | No import path for `dsr_` records exists; requests are created only by the subject through the API. | MVP |

## Data / schema
Export entry for requests: `{"dsr_id", "scope", "state", "requested_at", "executed_at", "counts"}`. Replay ledger in PS-077-06.

## Commands / queries / events
No import command. Backup restore emits `deletion.replayed` with counts.

## States & transitions
Restore: `restoring` → `replaying_deletions` → `serving`. Serving blocked until replay completes.

## Validation & errors
Restore with missing ledger → `DEL.LEDGER_MISSING` (422, not retryable; operator must choose older snapshot).

## Authorization
Restore is an operator action with dual control (CTR-CAP-001 R07).

## Failure, idempotency, concurrency, offline
Replay is idempotent on (target ID, store class). Interrupted replay resumes from ledger.

## Privacy, retention, abuse
Backups encrypted; deleted targets excluded from analytics restores (CTR-PRV-001 disclosure matrix).

## Observability & budgets
`del_replay_pending_targets` gauge; replay completes ≤ 1 h for 1 M targets (ASSUMPTION).

## Tests
- TEST-PS-077-10-01 (integration): export contains no deleted content.
- TEST-PS-077-10-02 (rollback): deployment rollback followed by restore does not serve deleted target.

## Acceptance criteria
1. TEST-PS-077-10-02 passes with a backup taken before deletion.
2. Export contains dates and counts only for deletion records.
3. No endpoint accepts `dsr_` import (static route check).

## Assumptions & open decisions
- ASSUMPTION: replay throughput target above.
- PROVISIONAL (D07 default): backup retention per schedule with replay on restore.
