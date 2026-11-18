# PS-106-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_in. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-106-06.R01 | Projection from `ntf_` event to inbox is idempotent by (`ntf_id`); replay creates no second item. | MVP |
| PS-106-06.R02 | Preference change applies to new projections immediately and does not retroactively hide existing items except via prune. | MVP |
| PS-106-06.R03 | Prune job is resumable by cursor and idempotent. | MVP |
| PS-106-06.R04 | Projection lag p95 ≤ 5 s after `ntf_` creation. | MVP |

## Data / schema
Projection key = `ntf_id`. Prune cursor stored per shard, retained 24 h.

## Commands / queries / events
- Set-preferences retried with same key returns same revision.
- Mark-read batch is all-or-nothing (PS-106-02.R04).

## States & transitions
Per workflow_state_machine.

## Validation & errors
`SYS.CONFLICT` on preference revision mismatch.

## Authorization
Projection uses sys grant at time of projection.

## Failure, idempotency, concurrency, offline
- Event consumer crash: redeliver by `(aggregate_id, revision)` order (CTR-EVT-001).
- Offline: read state changes queued per D08 PROVISIONAL pending queue; inbox list served from last sync.
- Concurrency: two devices mark read; monotonic rule resolves.

## Privacy, retention, abuse
Pending queue on device cleared on logout after acknowledgement.

## Observability & budgets
Lag histogram; projection errors counter.

## Tests
- TEST-PS-106-06-01 (integration): duplicate `ntf_` event yields one item.
- TEST-PS-106-06-02 (integration): prune resumes after kill.
- TEST-PS-106-06-03 (offline): mark-read offline then reconnect yields single read event.
- TEST-PS-106-06-04 (integration): projection lag under 5 s p95 at 500 events/s.

## Acceptance criteria
1. Replay safe in consumer test.
2. Prune resumable verified.
3. Lag budget verified in load test (to be run).

## Assumptions & open decisions
- ASSUMPTION: 500 events/s target per node.
- D08 PROVISIONAL (D08 default, unapproved).
