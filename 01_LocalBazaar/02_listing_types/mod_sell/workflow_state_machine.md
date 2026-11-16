# PS-006-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_sell. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-COM-001 (claim states R05–R16), CTR-EVT-001 (revision R02), CTR-ID-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-006-03.R01 | `sell_state` ∈ {AVAILABLE, RESERVED, HELD, SOLD}. Any event not in the transition table returns `SELL.STATE_INVALID` and writes nothing. | MVP |
| PS-006-03.R02 | A reservation lasts 72 h (ASSUMPTION) and is released automatically at expiry if no claim has passed CLAIMED. | MVP |
| PS-006-03.R03 | A sale is recorded only from a claim state that CTR-COM-001 allows for the claim's method (table below). A self-submitted claim never records a sale (CTR-COM-001 R06). | MVP |
| PS-006-03.R04 | A claim DISPUTED inside the 14-day window (CTR-COM-001 R16) moves the listing to HELD. Terms stay frozen until the dispute resolves. | MVP |
| PS-006-03.R05 | A reversed claim (CTR-COM-001 R12) restores one unit and returns the listing to AVAILABLE. | MVP |
| PS-006-03.R06 | Purchase requests move pending → accepted, declined, cancelled or expired. Request expiry is 7 days (ASSUMPTION). | MVP |

## Data / schema
Recordable claim states by method:

| Claim method (CTR-COM-001) | Recordable state |
|---|---|
| cash, other_external | COUNTERPARTY_ATTESTED |
| on-chain asset | EXTERNALLY_VERIFIED or FINAL |

Method `in_kind_compensation` is not offered for sell listings.

## Commands / queries / events
Commands drive these transitions; see [PS-006-04](commands_queries_events.md). Only `sys_` may drive claim-based transitions.

## States & transitions
| # | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|
| T1 | AVAILABLE | accept_request | request pending; quantity_remaining ≥ 1; revision matches | RESERVED | set reservation; create F09 `trx_`; emit `listing.reserved` |
| T2 | RESERVED | withdraw (buyer or owner) or reservation expiry | no claim beyond CLAIMED | AVAILABLE | clear reservation; cancel `trx_`; emit `listing.reservation_released` |
| T3 | RESERVED | claim DISPUTED | inside window | HELD | freeze terms; open F12 case by reference; emit `listing.sale_held` |
| T4 | RESERVED | claim reaches recordable state | per table above | SOLD if remaining = 0, else AVAILABLE | decrement remaining; clear reservation; emit `listing.sale_recorded` |
| T5 | HELD | claim REVERSED | — | AVAILABLE | restore one unit if it was decremented; emit `listing.sale_reversed` |
| T6 | HELD | dispute resolved, sale stands | recordable state | SOLD or AVAILABLE | emit `listing.sale_resumed` |
| T7 | HELD | dispute resolved, no sale | no recordable claim | AVAILABLE | clear reservation; emit `listing.reservation_released` |
| T8 | AVAILABLE | recordable claim for a released `trx_` | late attestation | HELD | owner notice; F12 case; quantity unchanged; emit `listing.sale_held` |
| T9 | SOLD | claim REVERSED | — | AVAILABLE | increment remaining; emit `listing.sale_reversed` |
| T10 | AVAILABLE or SOLD | F01 archive | no RESERVED or HELD | (archived by F01) | sell fields frozen |

Purchase request states: pending → accepted (T1), declined (owner), cancelled (buyer), expired (7 days). Accepted requests are terminal.

## Validation & errors
Invalid event for current state: `SELL.STATE_INVALID` (422, not retryable), logged with `from`, `event` and code only.

## Authorization
Transitions run under the actor matrix in [PS-006-05](authorization_capabilities.md). `sys_` may execute T4–T9 only.

## Failure, idempotency, concurrency, offline
Each transition is one write with a revision check (CTR-EVT-001 R02). Duplicate claim events are dropped by `event_id`. Out-of-order claim events are dropped by `state_version` (CTR-COM-001 R13). See [PS-006-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Transition logs store no buyer identity. Repeated expiries by one buyer or owner feed F12 signals (see [PS-006-07](privacy_retention_abuse.md)).

## Observability & budgets
Counter `state_invalid_total{from,event}` and histogram `reservation_age_seconds`. See [PS-006-08](observability_performance.md).

## Tests
- TEST-PS-006-03-01 (property): over random event sequences, 0 ≤ quantity_remaining ≤ quantity_total always holds.
- TEST-PS-006-03-02 (unit): one test per row T1–T10 and per request transition.
- TEST-PS-006-03-03 (integration): mock F09 emits CLAIMED → DISPUTED → REVERSED; listing ends AVAILABLE with original quantity.
- TEST-PS-006-03-04 (integration): attestation arriving after reservation expiry triggers T8.
- TEST-PS-006-03-05 (unit): an unlisted (from, event) pair returns `SELL.STATE_INVALID`.

## Acceptance criteria
1. Every state has a row for each event it can receive; all other pairs return `SELL.STATE_INVALID`.
2. No transition to SOLD occurs without a recordable claim state from the table.
3. A self-submitted claim leaves `sell_state` unchanged.
4. Reservation expiry releases the unit within 60 s of the 72 h deadline (ASSUMPTION).

## Assumptions & open decisions
- ASSUMPTION: 72 h reservation; 7-day request expiry; 60 s release jitter.
- D04 NOT APPLICABLE: sell is a single-seller exchange, not barter.
- D06 PROVISIONAL (default: signed statements only; external verification separate). Sale recording relies on F09 claim states, not on proof of handover.
- D07 PROVISIONAL (default: minimal retention). Applies to request records.
