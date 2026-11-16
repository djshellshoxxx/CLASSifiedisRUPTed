# PS-006-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_sell. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03, R09), CTR-COM-001 (R12, R13), CTR-ERR-001 (R03), CTR-CAP-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-006-06.R01 | Reservation creation is two-phase: F09 `trx_` is created first with idempotency key = `prq_` ID; the local reservation is then committed. If the commit fails, the `trx_` is cancelled by compensation. | MVP |
| PS-006-06.R02 | Calls to F09 time out at 3 s with 3 retries, exponential backoff 200 ms → 2 s with jitter (ASSUMPTION). Total budget 8 s. On exhaustion return `SYS.UNAVAILABLE` (retryable) and leave state unchanged. | MVP |
| PS-006-06.R03 | Claim-event consumption is at-least-once. Duplicates are dropped by `event_id`; events older than the stored `state_version` are dropped. | MVP |
| PS-006-06.R04 | Two accepts on one listing: exactly one succeeds. The second returns `SELL.RESERVATION_ACTIVE` or `SYS.CONFLICT`. | MVP |
| PS-006-06.R05 | A reconciliation job re-reads claim state for every open `trx_` every 15 min (ASSUMPTION). Drift between F09 and `sell_state` is corrected to F09 state and counted. | MVP |
| PS-006-06.R06 | Offline: `set_terms` and `request_purchase` queue locally until relay ack, 72 h maximum (ASSUMPTION, D08). `accept_request` and `decline_request` are online-only. | MVP |

## Data / schema
Idempotency record: `key`, `actor_ref`, `command`, `request_digest`, `result`, `created_at`. Retention RET-OPS (7 days). Claim cursor: `trx_id`, `last_state_version`, `last_event_id`.

## Commands / queries / events
Retry-safe commands per [PS-006-04](commands_queries_events.md). Idempotency scope (actor, command, key) per CTR-EVT-001 R03.

## States & transitions
Compensation paths: commit failure after `trx_` creation → cancel `trx_` → state remains AVAILABLE. F09 unavailable during release → reservation stays RESERVED and the release is retried by the expiry job; the unit is not counted as sold.

## Validation & errors
`SYS.UNAVAILABLE` (retryable true) for F09 or store timeouts. `SELL.STATE_INVALID` for stale or out-of-table events (no retry).

## Authorization
Retries re-run authorization on every attempt. A capability revoked during retry fails the retry with `SYS.FORBIDDEN`.

## Failure, idempotency, concurrency, offline
Concurrency: optimistic revision check on `set_terms`, `accept_request`, `decline_request`. Conflict returns `SYS.CONFLICT` (not retryable; client refetches). Offline queue entries expire after 72 h and are then discarded with a user notice; they are never replayed silently after expiry. Relay ack is required before a queued write is marked done.

## Privacy, retention, abuse
Queued offline payloads are stored encrypted at rest on the device (ASSUMPTION) and deleted on ack. Reconciliation logs carry IDs and counts only.

## Observability & budgets
Metrics: `f09_call_timeout_total`, `compensation_total`, `reconcile_drift_total`, `offline_queue_expired_total`. Alert if drift > 0 for 30 min (ASSUMPTION).

## Tests
- TEST-PS-006-06-01 (integration): F09 timeout on accept leaves `sell_state` AVAILABLE and returns `SYS.UNAVAILABLE`.
- TEST-PS-006-06-02 (integration): local commit failure after `trx_` creation cancels the `trx_`.
- TEST-PS-006-06-03 (property): duplicate and reordered claim events yield the same final state.
- TEST-PS-006-06-04 (integration): two concurrent accepts produce exactly one RESERVED transition.
- TEST-PS-006-06-05 (offline): queued `request_purchase` replays once after reconnect; entry older than 72 h is discarded with notice.

## Acceptance criteria
1. No path leaves a `trx_` open without a matching reservation or compensation.
2. Retries never produce a second reservation for one `prq_`.
3. Reconciliation corrects drift within one cycle (15 min, ASSUMPTION).
4. Offline `accept_request` is rejected by the client and the server.

## Assumptions & open decisions
- D08 PROVISIONAL (default: local pending queue until authenticated relay acknowledgment).
- ASSUMPTION: timeout, retry and reconciliation values above.
- PENDING CTR-COM-001: transaction-level event from F09 for `trx_` creation and cancellation. Claim-level events (`clm.state_changed`, R13) are used until it exists.
