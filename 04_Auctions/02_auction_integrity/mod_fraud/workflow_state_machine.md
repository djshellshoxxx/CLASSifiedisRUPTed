# PS-037-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_fraud. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-037-03.R01 | `FraudCase` states are exactly: OPEN, UNDER_REVIEW, UPHELD, DISMISSED, ESCALATED, AUTO_CLOSED. No other states. | MVP |
| PS-037-03.R02 | A moderator with any role on the auction (seller, bidder, seller-linked account) cannot claim or decide the case. Guard checked at claim and decide. | MVP |
| PS-037-03.R03 | A case in OPEN with no claim for 90 days moves to AUTO_CLOSED. No auction action is taken. | MVP |
| PS-037-03.R04 | A case in UNDER_REVIEW with no decision for 30 days returns to OPEN and the claim is released. | MVP |
| PS-037-03.R05 | Every transition appends one `fraud.case_*` event with `version` incremented by 1. | MVP |

## Data / schema
`FraudCase.status` enum and `version` per PS-037-01. `closed_at` set on UPHELD, DISMISSED, AUTO_CLOSED.

## Commands / queries / events
Transitions are triggered only by commands in PS-037-04 or timers (R03, R04).

## States & transitions
| from | event | guard | to | side effect |
|---|---|---|---|---|
| OPEN | case.claim (mod) | mod has case scope; R02 passes; version matches | UNDER_REVIEW | set assigned_mod; emit fraud.case_claimed |
| UNDER_REVIEW | case.dismiss | reason code and dec_ record written | DISMISSED | emit fraud.case_dismissed; appellant sees rule_id |
| UNDER_REVIEW | case.uphold | dec_ record written; reason code | UPHELD | emit fraud.case_upheld; mod_close reads decision |
| UNDER_REVIEW | case.escalate | severity high; mod has escalate capability | ESCALATED | notify F12 Trust and Safety |
| ESCALATED | case.resolve (F12 lead) | dec_ record written | UPHELD or DISMISSED | as above |
| OPEN | timer 90d | no claim | AUTO_CLOSED | emit fraud.case_auto_closed |
| UNDER_REVIEW | timer 30d | no decision | OPEN | clear assigned_mod; emit fraud.case_claim_released |

Terminal: UPHELD, DISMISSED, AUTO_CLOSED. Reopen is a new case, not a transition.

## Validation & errors
Invalid transition returns `FRAUD.CASE_STATE_CONFLICT` (retryable after re-read).

## Authorization
Guards reference capabilities in PS-037-05. Timers run as `sys` principal.

## Failure, idempotency, concurrency, offline
Each transition uses compare-and-set on `version`. Timer jobs are idempotent: a second run finds the state already moved. Offline: not applicable.

## Privacy, retention, abuse
Closed cases retained per PS-037-07. Claim and release events carry no notes text.

## Observability & budgets
Gauge: cases per state. Timer lag p95 <= 60 s.

## Tests
- TEST-PS-037-03-01 (unit): every row of the table executes exactly once with the stated side effect.
- TEST-PS-037-03-02 (unit): a bidder-moderator claim is rejected by R02.
- TEST-PS-037-03-03 (integration): 90-day timer fixture moves OPEN to AUTO_CLOSED with no auction change.

## Acceptance criteria
1. No transition exists outside the table.
2. Conflict-of-interest guard blocks claim and decide in all fixtures.
3. Version increments exactly once per transition.

## Assumptions & open decisions
- ASSUMPTION: 90-day and 30-day timers are defaults for F12 to confirm.
- PROVISIONAL (no Dxx): UPHELD does not cancel a finished auction; mod_close decides the consequence.
