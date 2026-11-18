# PS-079-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_retention (Privacy Lead, F10; backups F15.S03.M02). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06 backup replay, R07 holds), CTR-SCH-001 (R07 upcast, R08 lossless signed evidence), CTR-FED-001 (R07 tombstones).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-079-10.R01 | Policy versions are exported as configuration with version and approvals; no import of policy from outside the approval workflow. | MVP |
| PS-079-10.R02 | Restore replays all holds applied at backup time and all purges since backup before serving (PS-079-06 R04). | MVP |
| PS-079-10.R03 | Signed evidence (CTR-COM-001 claims, CTR-FED-001 envelopes) is never purged by a migration; migration only redacts personal fields under RET-EVD. | MVP |
| PS-079-10.R04 | Rollback of a policy version re-evaluates only `expired` records (PS-079-06 R05). | MVP |
| PS-079-10.R05 | Holds are included in backup manifests so a restore cannot silently drop them. | MVP |

## Data / schema
Export: `{"policy_version", "approved_by", "effective_from", "classes": {...}}` per class.

## Commands / queries / events
None beyond PS-079-04. Restore emits `retention.holds_replayed` with counts.

## States & transitions
Restore: `restoring` → `replaying_holds` → `serving`.

## Validation & errors
Restore with missing hold manifest → `SYS.INTERNAL` (not retryable); serving stays blocked and an incident opens.

## Authorization
Restore is an operator action with dual control (CTR-CAP-001 R07).

## Failure, idempotency, concurrency, offline
Replay is idempotent on hold ID.

## Privacy, retention, abuse
Backups encrypted; purged records excluded from analytics restores (CTR-PRV-001 disclosure row).

## Observability & budgets
`retention_restore_replay_seconds` p95 ≤ 1 h (ASSUMPTION).

## Tests
- TEST-PS-079-10-01 (restore): backup before hold, restore, hold present and enforced.
- TEST-PS-079-10-02 (migration): shortening migration leaves signed evidence bytes intact.

## Acceptance criteria
1. TEST-PS-079-10-01 and -02 pass.
2. Hold manifest present in every backup manifest (static check).
3. Rollback test confirms purged data is not restored.

## Assumptions & open decisions
- ASSUMPTION: replay ≤ 1 h.
- PROVISIONAL (D07 default).
