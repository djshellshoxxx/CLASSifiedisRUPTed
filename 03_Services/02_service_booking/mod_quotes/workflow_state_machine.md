# PS-032-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_quotes. **Parent:** [mod_quotes SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-COM-001, CTR-CAP-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-032-03.R01 | States: `DRAFT`, `SENT`, `ACCEPTED`, `DECLINED`, `WITHDRAWN`, `EXPIRED`, `SUPERSEDED`. No other state. | MVP |
| PS-032-03.R02 | Sending a quote places a hold on each `avw_` (PS-028-03), TTL 72 h (ASSUMPTION). | MVP |
| PS-032-03.R03 | `ACCEPTED` requires re-checking holds and `valid_until` in the same transaction that creates the `trx_`. Failure leaves the quote `SENT`. | MVP |
| PS-032-03.R04 | `ACCEPTED`, `DECLINED`, `WITHDRAWN`, `EXPIRED` and `SUPERSEDED` are terminal. Any price or scope change creates a new quote (`SUPERSEDED` links to new `svq_`). | MVP |
| PS-032-03.R05 | No state is labelled "paid" or "settled". Accepted means "accepted by customer" only (CTR-COM-001 R15 applies to claims). | MVP |

## Data / schema
`status`, `revision`, `valid_until`. `supersedes` and `superseded_by` link chains.

## Commands / queries / events
Transitions from `svcquote.*` commands and from `svcavail.hold.expired` events.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| DRAFT | svcquote.send | Validation passes; holds placed | SENT | Holds; notify customer |
| DRAFT | svcquote.withdraw | Provider | WITHDRAWN | None |
| SENT | svcquote.accept | Customer = addressed customer; hash matches; holds intact; now < valid_until | ACCEPTED | Create `trx_` via F09 (same transaction); BOOKED link |
| SENT | svcquote.decline | Customer | DECLINED | Release holds |
| SENT | svcquote.withdraw | Provider | WITHDRAWN | Release holds |
| SENT | timer (valid_until) | now ≥ valid_until | EXPIRED | Release holds |
| SENT | svcquote.supersede | Provider; new quote validated | SUPERSEDED | Release holds; link new quote |

Forbidden transitions return `SVCQUOTE.INVALID_TRANSITION` (409, not retryable). Accept after expiry returns `SVCQUOTE.EXPIRED` (410 gone class is not used; 422 unprocessable_state).

## Validation & errors
`SVCQUOTE.INVALID_TRANSITION`; `SVCQUOTE.EXPIRED`; `SVCQUOTE.HOLD_LOST` (hold expired before accept → retryable false, customer must request a new quote).

## Authorization
Provider: create, send, withdraw, supersede (`svq.create`, `svq.update`). Customer: accept, decline (`svq.accept`, `svq.decline`). Timer runs as `sys`.

## Failure, idempotency, concurrency, offline
Accept is CAS on `revision` (CTR-EVT-001 R02) and on `price_hash`. Two concurrent accepts: one succeeds, the other receives `SYS.CONFLICT`. Outbox pattern: `trx_` creation and state change committed together; event delivery at-least-once.

## Privacy, retention, abuse
Customer identity shown to provider only after accept or decline. Expired and withdrawn quotes follow PS-032-07 retention.

## Observability & budgets
Metrics: `svcquote_transitions_total{from,to}`, `svcquote_accept_latency_seconds` p95 ≤ 300 ms, `svcquote_hold_lost_total`.

## Tests
- TEST-PS-032-03-01 (unit): every row in the table; other pairs rejected.
- TEST-PS-032-03-02 (concurrency): two accepts on one quote → one ACCEPTED, one `SYS.CONFLICT`.
- TEST-PS-032-03-03 (fault): trx creation fails → quote remains SENT, no `trx_` row.
- TEST-PS-032-03-04 (integration): hold expired before accept → `SVCQUOTE.HOLD_LOST`.

## Acceptance criteria
1. State table complete; lint enumerates states.
2. No state label contains "paid" or "settled" (lint over UI catalog).
3. Accept is atomic with `trx_` creation in all fault tests.

## Assumptions & open decisions
- ASSUMPTION: 72 h hold TTL, aligned with PS-028-03.
- PROVISIONAL: trx and claim semantics per CTR-COM-001 (D06 default, unapproved). See [DECISIONS.md](../../../DECISIONS.md) D04.
