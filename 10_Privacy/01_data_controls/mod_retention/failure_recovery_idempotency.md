# PS-079-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_retention (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06 replay of deletions and holds on restore; R07), CTR-EVT-001 (R02, R03), CTR-ERR-001 (R03).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-079-06.R01 | Sweep is idempotent per (class, policy version, window); rerun purges nothing new and emits no duplicate events. | MVP |
| PS-079-06.R02 | Purge of a record is checked against holds inside the same transaction as the delete; a hold applied mid-sweep wins. | MVP |
| PS-079-06.R03 | Purge failures on one store class do not block other classes; record stays `expired` and is retried. | MVP |
| PS-079-06.R04 | Restore from backup replays applied holds and purge decisions before serving (CTR-PRV-001 R06). | MVP |
| PS-079-06.R05 | Rollback of a policy version does not restore purged data; it re-evaluates `expired` records only. | MVP |

## Data / schema
`retention_sweep_run` (run_id, class, version, started_at, finished_at, purged_count, held_skipped_count, failed_count). RET-OPS.

## Commands / queries / events
`record.purged` per batch with counts; `retention.sweep_failed` after 3 failed runs for a class.

## States & transitions
Failure leaves records in `expired`; no state rollback.

## Validation & errors
`RETAIN.SWEEP_BACKLOG` (503, retryable) when backlog > 24 h; `SYS.INTERNAL` (not retryable) for invariant violations, which halt that class sweep.

## Authorization
Sweep runs only under `sys_` grant (PS-079-05 R04).

## Failure, idempotency, concurrency, offline
Batch size 1,000 records per transaction (ASSUMPTION). Lease per (class, window). Backoff 1 min to 1 h.

## Privacy, retention, abuse
Failure logs contain class and counts only.

## Observability & budgets
`retention_sweep_backlog_seconds` p95 ≤ 3600 (ASSUMPTION); alert > 24 h.

## Tests
- TEST-PS-079-06-01 (fault): kill sweep mid-batch; rerun completes without double events.
- TEST-PS-079-06-02 (restore): backup taken before purge; restore replays purge and holds.

## Acceptance criteria
1. No duplicate `record.purged` for same record (TEST-PS-079-06-01).
2. Restore never serves purged or held-then-expired incorrectly (TEST-PS-079-06-02).
3. Backlog alert fires in fault test.

## Assumptions & open decisions
- ASSUMPTION: batch size 1,000; backlog thresholds above.
- PROVISIONAL (D07 default).
