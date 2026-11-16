# PS-011-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/04_pricing/mod_offers. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision, append-only events), CTR-CAP-001 (relation rules), CTR-SCH-001. PENDING F01 listing-state contract (listing open/closed).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-011-03.R01 | Server states: `submitted`, `accepted`, `rejected`, `withdrawn`, `expired`, `superseded`. No other server state. `draft` is client-only (D08). | MVP |
| PS-011-03.R02 | Every state except `submitted` is terminal. Any event on a terminal offer → SYS.UNPROCESSABLE_STATE. | MVP |
| PS-011-03.R03 | `accepted` records a price agreement only. No transition leads to payment, handover or completion. | MVP |
| PS-011-03.R04 | Each transition increments `revision` by exactly 1 and emits one event (CTR-EVT-001 R02). | MVP |
| PS-011-03.R05 | Only the seller may accept or reject; only the buyer may withdraw; only sys may expire. | MVP |
| PS-011-03.R06 | An offer is never `submitted` past `expires_at`. Evaluated at commit with server clock. | MVP |
| PS-011-03.R07 | Accepting one offer moves other `submitted` offers on the same listing to `superseded` (saga, PS-011-06). | MVP |
| PS-011-03.R08 | Withdrawal is possible only while `submitted`. No revocation after acceptance (ASSUMPTION). | MVP |

## Data / schema
State is the `status` field in PS-011-01. Transition log = event stream of the offer aggregate (`revision` ordered).

## Commands / queries / events
Commands and events in PS-011-04. Events emitted per transition are listed in the table below.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | offer.submit | PS-011-02 rules pass; expected_revision null | submitted | emit offer.submitted |
| submitted | offer.accept | actor is seller; now < expires_at; revision matches; listing open | accepted | emit offer.accepted; start supersede saga for other submitted offers on listing |
| submitted | offer.reject | actor is seller; revision matches | rejected | emit offer.rejected |
| submitted | offer.withdraw | actor is buyer; revision matches | withdrawn | emit offer.withdrawn |
| submitted | offer.expire | now ≥ expires_at (timer or lazy check) | expired | emit offer.expired, reason timeout |
| submitted | listing.closed (F01, PENDING) | listing no longer open | expired | emit offer.expired, reason listing_closed |
| submitted | account.deleted (F07) | buyer account deleted | withdrawn | emit offer.withdrawn, reason account_deleted |
| submitted | supersede (saga) | another offer on the listing was accepted | superseded | emit offer.superseded |

## Validation & errors
Invalid transitions return SYS.UNPROCESSABLE_STATE (terminal) or EVT.REVISION_CONFLICT (stale revision). Codes in PS-011-04.

## Authorization
Actor-to-transition rules are in PS-011-05.

## Failure, idempotency, concurrency, offline
- Concurrent accept and withdraw on the same offer: exactly one commits; the other returns EVT.REVISION_CONFLICT.
- Timeouts: `expires_at` is the only time-based transition. Missed timers are corrected on read or commit.
- Compensation: none for accept. A mistaken accept is corrected by operator correction (PS-011-10), not by reverting state.
- Full retry and recovery rules in PS-011-06.

## Privacy, retention, abuse
Transitions emit reason codes and IDs only (no amounts in audit records). Terminal retention in PS-011-07.

## Observability & budgets
Metric `offer_transitions_total{from,to}`. Expiry lag ≤ 60 s p95 (ASSUMPTION).

## Tests
- TEST-PS-011-03-01 (unit): each row of the transitions table produces the stated `to` state and event.
- TEST-PS-011-03-02 (property): from any terminal state, every event is rejected with SYS.UNPROCESSABLE_STATE.
- TEST-PS-011-03-03 (concurrency): 20 parallel accept/withdraw calls on one offer yield exactly one commit.
- TEST-PS-011-03-04 (time): offer accepted at expires_at minus 1 ms succeeds; at expires_at fails with OFFER.EXPIRED.
- TEST-PS-011-03-05 (saga): accept of one offer supersedes all other submitted offers on the listing, including after a forced retry.

## Acceptance criteria
1. Transition table complete: no transition missing for any (state, event) pair in scope.
2. No transition produces a payment, custody or completion state.
3. TEST-PS-011-03-01 through -05 pass in CI.

## Assumptions & open decisions
- ASSUMPTION: accepted is final; corrections use operator events.
- PROVISIONAL (D04 and D09 defaults, unapproved): no atomic real-world handover; accept is agreement only.
- OPEN: listing-closed event name and payload (PENDING F01).
