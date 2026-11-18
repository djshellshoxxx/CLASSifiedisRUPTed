# PS-077-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_delete (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-PRV-001 (idempotent deletion; backup replay R06), CTR-FED-001 (R07, outbound queue), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-077-06.R01 | Deletion of a target is idempotent on (`dsr_`, target ID); repeats return the same completion record. | MVP |
| PS-077-06.R02 | Each store class deletion has a 30 s timeout; a timeout is recorded as an attempt, not as success. | MVP |
| PS-077-06.R03 | Partial failure leaves the target in `executing` with a per-store record; the executor resumes from the failed store only. | MVP |
| PS-077-06.R04 | Backup restore replays all completed deletions and holds before serving restored data (CTR-PRV-001 R06). | MVP |
| PS-077-06.R05 | Outbound tombstones queued for a peer in state `revoked` are discarded (CTR-FED-001 trust table); queued tombstones for `quarantined` peers are retained and retried. | MVP |

## Data / schema
Per-target attempts stored in `dsr_target` (PS-077-03). Replay ledger: `deletion_replay(target_id, store_class, completed_at)`, RET-AUD.

## Commands / queries / events
Executor emits `deletion.failed` only after retry budget is exhausted. Replayed deletions emit `record.deleted` with `replayed: true`.

## States & transitions
Failure paths map to PS-077-03: retries stay in `executing`; exhaustion → `failed`; hold → `held`.

## Validation & errors
`SYS.UNAVAILABLE` (retryable) for store outages; `SYS.INTERNAL` (not retryable) for executor logic errors, which open an incident.

## Authorization
Replay and resume run under the executor grant (PS-077-05 R05) only.

## Failure, idempotency, concurrency, offline
Retry: exponential backoff, 1 s base, 10 min cap, 3 rounds in 24 h (ASSUMPTION). Concurrency: one executor lease per request (60 s). Offline clients: a pending cancel remains queued under D08 until acknowledged; a cancel acknowledged after window close returns `DEL.CANCEL_WINDOW_CLOSED` and the client shows the outcome.

## Privacy, retention, abuse
Replay ledger contains IDs and timestamps only. Local caches are purged on logout and account switch (CTR-PRV-001 offline section).

## Observability & budgets
`del_store_attempts_total{store_class, outcome}`; propagation lag p95 ≤ 24 h (alert > 24 h).

## Tests
- TEST-PS-077-06-01 (integration): inject timeout on search-index store; retry completes; one completion record.
- TEST-PS-077-06-02 (integration): restore from backup snapshot taken before deletion; deletion replayed before serve.

## Acceptance criteria
1. Duplicate executions produce one completion record (TEST-PS-077-06-01).
2. No restored backup serves a deleted target (TEST-PS-077-06-02).
3. Tombstones to revoked peers are discarded and logged with count only.

## Assumptions & open decisions
- ASSUMPTION: retry budget 3 rounds in 24 h.
- PROVISIONAL (D08 default): local pending queue until authenticated relay acknowledgment.
