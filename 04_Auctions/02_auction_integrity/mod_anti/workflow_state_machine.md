# PS-036-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_anti. **Parent:** [mod_anti SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-036-03.R01 | Schedule states: `NORMAL`, `IN_WINDOW` (bid accepted in window, extension pending evaluation, transient), `EXTENDED` (effective end pushed), `EXTENSION_CAP_REACHED`, `ENDED` (handed to F04.S01.M03). | MVP |
| PS-036-03.R02 | `ENDED` is terminal. No extension is possible after the close job reads `effective_end` under lock. | MVP |
| PS-036-03.R03 | `EXTENSION_CAP_REACHED` is terminal for extensions but not for bids; bids continue to be accepted until effective end. | MVP |
| PS-036-03.R04 | Each transition emits one event with `schedule_revision`. | MVP |

## Data / schema
`schedule_state` and `schedule_revision` on the auction embedded schedule.

## Commands / queries / events
Transitions from `anti.evaluate_bid` and from close (`ENDED`).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| NORMAL | bids.bid.accepted | t in window and count < max | EXTENDED | Log row; new effective end; event |
| NORMAL | bids.bid.accepted | t in window and count = max | EXTENSION_CAP_REACHED | Event `auction.extension_cap_reached` |
| NORMAL, EXTENDED | bids.bid.accepted | t not in window | (unchanged) | No event beyond bid |
| EXTENDED | bids.bid.accepted | t in window and count < max | EXTENDED | Log row; end pushed |
| EXTENDED | bids.bid.accepted | t in window and count = max | EXTENSION_CAP_REACHED | Event |
| NORMAL, EXTENDED, EXTENSION_CAP_REACHED | close handoff | now ≥ effective end | ENDED | Close record (F04.S01.M03) |

Forbidden transitions return `ANTISNIP.INVALID_TRANSITION` (409, not retryable).

## Validation & errors
`ANTISNIP.INVALID_TRANSITION`; `ANTISNIP.POLICY_PINNED` for policy change attempts.

## Authorization
Evaluation is `sys`. Policy publication is `ope` dual control.

## Failure, idempotency, concurrency, offline
Evaluation idempotent per (`auc_`, `bid_sequence`). Concurrent evaluations serialized by auction lock (CAS on `schedule_revision`). Crash during evaluation: recompute from log and last evaluated sequence.

## Privacy, retention, abuse
Events carry `auc_` and `bid_id` only.

## Observability & budgets
Metrics: `antisnip_extensions_total`, `antisnip_cap_reached_total`, `antisnip_evaluation_lag_seconds` p95 ≤ 1 s.

## Tests
- TEST-PS-036-03-01 (unit): every row in table; other pairs rejected.
- TEST-PS-036-03-02 (property): `extension_count` never exceeds `max_extensions`.
- TEST-PS-036-03-03 (fault): crash mid-evaluation → replay yields identical schedule.
- TEST-PS-036-03-04 (integration): bid after cap in window does not extend but is accepted.

## Acceptance criteria
1. Cap property passes with zero violations.
2. Replay determinism verified across fault suite.
3. Terminal ENDED verified: no extension after close read.

## Assumptions & open decisions
- ASSUMPTION: a bid after the cap is still accepted before effective end.
- Boundary with F04.S02.M02 `mod_sniping` (detection and reporting) is PROVISIONAL. See [DECISIONS.md](../../../DECISIONS.md).
