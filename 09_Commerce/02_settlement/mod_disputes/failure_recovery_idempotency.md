# PS-070-06 — failure, recovery, idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_disputes (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03, R09), CTR-COM-001 (R13), CTR-ERR-001 (R03). **Decisions:** D04, D08 (PROVISIONAL defaults, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-070-06.R01 | Raise and claim transition commit atomically; a failed claim write leaves no dispute row. | MVP |
| PS-070-06.R02 | Escalation timer is idempotent on (`dispute_id`, `state_version`) and runs at least once; duplicate fire is a no-op. | MVP |
| PS-070-06.R03 | Idempotency record per (actor, command, key), 7-day retention (RET-OPS). | MVP |
| PS-070-06.R04 | Dispute commands share one `correlation_id` with the claim saga (CTR-EVT-001 R09). | MVP |
| PS-070-06.R05 | Client retry only for `retryable = true` codes; max 3 attempts, backoff 1 s, 2 s, 4 s. | MVP |

## Data / schema
Timer table: `dispute_id`, `fire_at`, `state_version_at_schedule`, `status` (`pending`, `fired`, `skipped`).

## Commands / queries / events
Timer fire writes `dispute.escalated` only if the dispute is still `OPEN` at the same `state_version`; otherwise it records `skipped`.

## States & transitions
No new states. Partial failure leaves the dispute at its last committed state.

## Validation & errors
`EVT.REVISION_CONFLICT` if the aggregate revision moved; `SYS.CONFLICT` for stale client version; `SYS.UNAVAILABLE` for store outage (retryable).

## Authorization
Timer runs as `sys_` with scope `dispute timers`; cannot change `statement` or evidence.

## Failure, idempotency, concurrency, offline
- Crash between dispute write and claim write is impossible by R01; if the store fails, both roll back.
- Offline (D08): dispute composition is local draft; raise is sent only on connectivity and shows "Sent, waiting for confirmation" until ack. A draft is never shown as an open dispute.
- Concurrent respond and withdraw: first committed wins.
- Timer missed due to outage: on recovery, overdue timers fire within 5 min (ASSUMPTION), in due-date order.

## Privacy, retention, abuse
Draft statements stay encrypted on device and are wiped on logout. Idempotency rows store digests only.

## Observability & budgets
Metrics: escalation lag (p95 ≤ 5 min after due), timer skip count, conflict rate. Alert if escalation lag exceeds 30 min.

## Tests
- TEST-PS-070-06-01 (integration): claim write failure rolls back dispute row.
- TEST-PS-070-06-02 (integration): duplicate timer fire yields one escalation.
- TEST-PS-070-06-03 (offline): raise draft offline is not shown as open until ack.
- TEST-PS-070-06-04 (integration): outage over due date; recovery escalates overdue disputes in due order.

## Acceptance criteria
1. Zero orphan dispute rows in 1000 fault-injection runs.
2. Escalation lag p95 ≤ 5 min in staging soak.
3. Offline draft never displayed as open dispute (UI test).

## Assumptions & open decisions
- ASSUMPTION: 5-minute catch-up window after outage.
- D08 (PROVISIONAL default, unapproved). D04 (PROVISIONAL default, unapproved).
