# PS-120-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_backups (F15.S03.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-120-03.R01 | A set is `complete` only after `verifying` passes; no set is usable for restore before `complete`. | MVP |
| PS-120-03.R02 | `expired` sets are not restorable except under a legal hold that was active before expiry. | MVP |
| PS-120-03.R03 | `purged` is terminal and removes all objects and the manifest; the metadata row keeps only `bkp_id`, scope, counts and purge time. | MVP |
| PS-120-03.R04 | A legal hold blocks `expired` to `purged` for the held set only (CTR-PRV-001 R07). | MVP |
| PS-120-03.R05 | Failed jobs keep partial objects for 24 h for diagnosis, then delete them. | MVP |

## Data / schema
`status` field of PS-120-01. Events: `backup.started`, `backup.completed`, `backup.failed`, `backup.expired`, `backup.purged` (CTR-EVT-001 envelope, `aggregate_type = backup`).

## Commands / queries / events
Transitions are triggered by `backup.schedule`, `backup.run`, `backup.verify`, `backup.expire`, `backup.purge` (PS-120-04).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | schedule | PS-120-02 passes | scheduled | `backup.scheduled` local record |
| scheduled | run_start | no active job for scope and kind | running | emit `backup.started` |
| running | chunks_done | all chunk hashes recorded | verifying | none |
| running | timeout or unrecoverable_error | — | failed | emit `backup.failed` with code |
| verifying | verify_pass | R05 of PS-120-02 and sample restore check pass | complete | set `verified_at`; emit `backup.completed` |
| verifying | verify_fail | any check fails | failed | emit `backup.failed` with `BACKUP.VERIFY_FAILED` |
| complete | expires_at_reached | no legal hold | expired | emit `backup.expired` |
| expired | purge_due | no legal hold | purged | delete objects; emit `backup.purged` |
| failed | cleanup_due | 24 h elapsed | purged | delete partial objects |

## Validation & errors
`BACKUP.VERIFY_FAILED` (internal, 500, not retryable). A failed verification never auto-retries against the same set.

## Authorization
Transitions are driven by the `sys` scheduler; manual purge needs PS-120-05 capabilities.

## Failure, idempotency, concurrency, offline
Each transition is idempotent on (`bkp_id`, from, event). Two schedulers cannot both run one set (lease held by the job).

## Privacy, retention, abuse
Purge deletes ciphertext objects; crypto-shredding of the wrapped data key follows the same transition.

## Observability & budgets
Metric: `backup_state_transitions_total{from,to}`. Alert on any set stuck in `running` > 6 h.

## Tests
- TEST-PS-120-03-01 (unit): every transition row; illegal transition rejected.
- TEST-PS-120-03-02 (integration): verify failure leaves set `failed`, not `complete`.
- TEST-PS-120-03-03 (integration): legal hold blocks purge for held set only; unrelated set purges on schedule.
- TEST-PS-120-03-04 (integration): process kill during `running` results in `failed` on restart, then new job.

## Acceptance criteria
1. No restorable set in `running`, `verifying` or `failed` (TEST-02 and PS-120-05).
2. TEST-PS-120-03-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 6 h job timeout; 24 h partial-object retention.
- PROVISIONAL (D07 default).
