# PS-012-06 — failure recovery idempotency
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_counteroffer. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (idempotency, `correlation_id` saga, outbox), CTR-ERR-001 (retry flags), CTR-SCH-001 (client queue versions).

**Decision label:** Offline pending queue is PROVISIONAL (D08 default, unapproved). Timeouts and retry counts are ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-012-06.R01 | Replaying a command with the same key and digest returns the original result and emits no new event (7-day window). Same key, different digest → `EVT.IDEMPOTENCY_KEY_REUSED`. | MVP |
| PS-012-06.R02 | `counter.accept`, `counter.create` and the cycle revision write commit in one transaction; no partial acceptance is observable. | MVP |
| PS-012-06.R03 | Concurrent accept and counter on the same `cyc_` serialize on the `cyc_` row lock. The loser receives `CTROFFER.COUNTER_NOT_OPEN` or `EVT.REVISION_CONFLICT`. | MVP |
| PS-012-06.R04 | Notifications and downstream events leave the transaction through an outbox; at-least-once delivery; consumers dedupe on `event_id`. | MVP |
| PS-012-06.R05 | Command server timeout 5 s (ASSUMPTION). Client retry only with the original key, backoff 0.5 s base, 8 s cap, 5 attempts (ASSUMPTION). | MVP |

## Concurrency and partial failure
| Situation | Behavior |
|---|---|
| Accept races with supersede | Row lock on `cyc_`; first commit wins; other returns `COUNTER_NOT_OPEN` (not retryable). |
| Quote expires between create and accept | Accept guard fails; counter stays OPEN until expiry; no revision change. |
| Outbox publish fails after commit | Retry with backoff; agreed state is never rolled back. |
| Cycle write fails inside accept | Entire accept rolls back; counter stays OPEN. |
| Item taken by another trade | Invalidation sweep (≤ 60 s, ASSUMPTION) sets INVALIDATED with `ITEM_GONE`. |

## Offline (PWA)
- Client may queue create, accept, reject and withdraw as pending (D08). Pending is never shown as agreed.
- Commit re-validates `target_revision`, counter status, holder status, item availability and quote. Stale pending entries are rejected with the applicable code.
- Pending entries expire on device after 24 h (ASSUMPTION).

## Recovery
- Restore or replay never resurrects an OPEN counter past `expires_at`; the expiry sweep runs before the service accepts traffic.
- Saga for cross-module effects uses one `correlation_id` (CTR-EVT-001.R09).

## Assumptions & open decisions
- D08 PROVISIONAL (D08 default, unapproved): local pending queue until authenticated relay acknowledgment.
- ASSUMPTION: the `cyc_` revision write is performed by the cycle module through an internal call in the same database transaction (owner unresolved; see PS-012-03).
- PENDING: confirmation of CTR-EVT-001 outbox and idempotency retention values.
