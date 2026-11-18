# PS-015-07 — privacy, retention and abuse
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_two. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-015-07.R01 | Cycle records hold no location, no account IDs and no free text (PS-015-01 R05). | MVP |
| PS-015-07.R02 | A proposer may open ≤ 10 new cycles per 24 h and ≤ 5 unanswered cycles at once (ASSUMPTION). | MVP |
| PS-015-07.R03 | Withdrawal after `fully_accepted` is counted as a grief signal; ≥ 5 in 30 days triggers F12 review (ASSUMPTION). | MVP |
| PS-015-07.R04 | Cycle metadata is never public or federated in MVP. | MVP |

## Data / schema
Retention: closed cycles kept 90 days after close, then minimal record (IDs, status, timestamps) for audit (D07 PROVISIONAL).

## Commands / queries / events
Deletion events carry IDs and counts only.

## States & transitions
Closure starts retention clock.

## Validation & errors
Rate-limit code `TWO.RATE_LIMITED` (retryable after window).

## Authorization
Owner export includes own cycles' status history; counterparties' account IDs are never present.

## Failure, idempotency, concurrency, offline
Retention sweep idempotent per `cyc_id`.

## Privacy, retention, abuse
Matched-cycle proposals can reveal who was linked by candidate search; candidate IDs are not shown outside participants. Cycles used to probe others' holdings are limited because lines are participant-only. Reports go to F12 by `rpt_` ID.

## Observability & budgets
Rate-limit counters per rule, never per identity.

## Tests
- TEST-PS-015-07-01 (abuse): 11th proposal in 24 h refused.
- TEST-PS-015-07-02 (abuse): five grief withdrawals raise F12 review event.
- TEST-PS-015-07-03 (privacy): export contains no counterparty account IDs.

## Acceptance criteria
1. Zero account IDs or free text in analytics and federation fixtures.
2. Retention purge matches class table for all fixtures.

## Assumptions & open decisions
- ASSUMPTION: R02 and R03 thresholds are initial values.
- D07 PROVISIONAL (Dxx default, unapproved): minimal retention with legal-hold exceptions.
