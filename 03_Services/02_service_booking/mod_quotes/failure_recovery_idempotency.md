# PS-032-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_quotes. **Parent:** [mod_quotes SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-COM-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-032-06.R01 | Accept is atomic: quote state change, `trx_` creation and booking link commit in one transaction (outbox for events). | MVP |
| PS-032-06.R02 | Duplicate accept with same key returns the original `trx_id`; no second `trx_` is created. | MVP |
| PS-032-06.R03 | If any hold is lost before accept, accept fails with `SVCQUOTE.HOLD_LOST`; no partial booking. | MVP |
| PS-032-06.R04 | Expiry timer releases holds within 90 s of `valid_until` (PS-028-06 R02). | MVP |
| PS-032-06.R05 | Offline accept is queued (D08) and returns server result on acknowledgement; if the quote expired, the queued accept fails and the UI says so. | MVP |

## Data / schema
Idempotency record per (actor, command, key, digest). Outbox row per event with `event_id`.

## Commands / queries / events
Outbox relay publishes `svcquote.accepted` at-least-once; consumers dedupe.

## States & transitions
No recovery path moves ACCEPTED back to SENT. A failed `trx_` creation keeps SENT (PS-032-03 R03).

## Validation & errors
Retryable: `SYS.UNAVAILABLE` (503), `SYS.RATE_LIMITED`. Non-retryable: `SVCQUOTE.HOLD_LOST`, `SVCQUOTE.EXPIRED`, `SYS.CONFLICT`.

## Authorization
Timer and outbox relay run as `sys`.

## Failure, idempotency, concurrency, offline
- F09 unavailable during accept: whole accept fails with `SYS.UNAVAILABLE`; client retries with same key (max 5, backoff 1–30 s).
- Customer double-tap: same key; second call returns first result.
- Provider sends supersede during customer accept: CAS on revision decides; loser receives `SYS.CONFLICT`.
- Offline: queued accepts are never shown as accepted until ack.

## Privacy, retention, abuse
Recovery logs contain IDs and codes only. Outbox payloads are the event payload with no free text.

## Observability & budgets
Metrics: `svcquote_outbox_lag_seconds` p95 ≤ 5 s; `svcquote_accept_retries_total`; `svcquote_partial_accept_total` (must stay 0).

## Tests
- TEST-PS-032-06-01 (fault): kill after trx insert, before commit → no trx row, quote SENT.
- TEST-PS-032-06-02 (concurrency): duplicate accept with same key → one `trx_`.
- TEST-PS-032-06-03 (fault): F09 timeout → `SYS.UNAVAILABLE`, retry succeeds once.
- TEST-PS-032-06-04 (offline): queued accept after expiry rejected on ack with `SVCQUOTE.EXPIRED`.

## Acceptance criteria
1. `svcquote_partial_accept_total` is 0 across fault suite.
2. No duplicate `trx_` in 1,000 replayed accepts.
3. Offline accepts never display as confirmed before ack.

## Assumptions & open decisions
- ASSUMPTION: outbox relay at-least-once; 5 s lag budget.
- PROVISIONAL: offline writes pending until acknowledgement (D08 default, unapproved). See [DECISIONS.md](../../../DECISIONS.md).
