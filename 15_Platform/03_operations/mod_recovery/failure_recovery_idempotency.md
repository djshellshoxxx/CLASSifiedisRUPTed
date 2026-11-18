# PS-122-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_recovery (F15.S03.M03). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-FED-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-122-06.R01 | Event chain verification must pass before replay; any gap yields `EVT.REVISION_GAP` and halts (never skips, CTR-EVT-001 R02). | MVP |
| PS-122-06.R02 | After restore, idempotency records older than the restore point are unknown; the restored store rejects replays with keys it cannot verify by returning the owner module's current state (no duplicate effect). | MVP |
| PS-122-06.R03 | Offline devices with pending queues (PS-116) are told to re-sync after restore if their last acknowledged revision is above restored head. | MVP |
| PS-122-06.R04 | Federation: inbound deduplication key (`origin_node`, `event_id`) is restored; peers receive a resync request for the gap window (CTR-FED-001). | MVP |
| PS-122-06.R05 | Signed evidence restored byte-identical; lossy migration refused (CTR-SCH-001 R08). | MVP |
| PS-122-06.R06 | Failure at any step leaves the isolated target unpromotable and keeps logs; the run moves to `failed`. | MVP |

## Data / schema
Restore checkpoints: step name, digest of inputs, counts; stored in the run record.

## Commands / queries / events
`restore_run.step` is idempotent on (`rst_id`, step_name).

## States & transitions
`failed` reachable from every active state (PS-122-03).

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| RECOVERY.HASH_CHAIN_BROKEN | false | internal / 500 | Chain verification fails. |
| RECOVERY.HOLD_REPLAY_INCOMPLETE | false | precondition_failed / 412 | Holds or tombstones not fully replayed. |
| RECOVERY.STEP_FAILED | true | internal / 500 | Transient step failure; same step may be retried. |
| EVT.REVISION_GAP | true | internal / 500 | Gap detected; resync then retry. |

## Authorization
Retries use the initiating operator's session and capabilities; a revoked capability stops the run.

## Failure, idempotency, concurrency, offline
Concurrency: one active run per target. Recovery objective RPO 15 min and RTO 4 h (ASSUMPTION), measured in each drill.

## Privacy, retention, abuse
Failed-run diagnostics contain codes and counts only.

## Observability & budgets
Alert on any `failed` run; alert on drill RTO > 4 h.

## Tests
- TEST-PS-122-06-01 (fault): revision gap injected; run halts; no skipped revision.
- TEST-PS-122-06-02 (integration): replayed command after restore produces no duplicate effect.
- TEST-PS-122-06-03 (integration): offline device with higher revision resyncs.
- TEST-PS-122-06-04 (integrity): evidence object digest identical after restore.

## Acceptance criteria
1. No skipped revision in any test (TEST-01).
2. TEST-PS-122-06-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: idempotency window of 7 days is restored as "unknown" for older keys.
- PROVISIONAL (D08 default): offline queue reconciliation after restore.
