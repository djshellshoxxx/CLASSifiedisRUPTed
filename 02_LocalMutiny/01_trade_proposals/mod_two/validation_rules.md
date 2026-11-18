# PS-015-02 — validation rules
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_two. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-CAP-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-015-02.R01 | Proposal requires 2–6 distinct `par_` slots, each `invited` and bound to a different `acc_`. | MVP |
| PS-015-02.R02 | Fully-accepted requires every slot `accepted`, each with one submitted offer (`mod_offer`), and a `feasible` result from F02.S02.M05. | MVP |
| PS-015-02.R03 | Expiry must satisfy 0 < expires_at − proposed_at ≤ 7 days; default 72 h. | MVP |
| PS-015-02.R04 | Any superseded offer on an accepted slot resets that slot to `invited`-equivalent readiness and the cycle to `proposed`. | MVP |

## Data / schema
Errors `TWO.<CODE>`; `message_key` `err.two.<code>`.

## Commands / queries / events
Applies to `cycle.propose`, `cycle.withdraw`, `cycle.lock`, `cycle.close`, and system transitions (PS-015-04).

## States & transitions
R02 and R04 evaluated on each slot event. Lock evaluates R02 again.

## Validation & errors
| Code | Retryable | Rule |
|---|---|---|
| TWO.SIZE_RANGE | false | R01 violated |
| TWO.SLOT_STATE | false | slot not `invited` or `accepted` as required |
| TWO.MISSING_OFFER | true | an accepted slot lacks a submitted offer; retry after submit |
| TWO.INFEASIBLE | false | feasibility result not `feasible` |
| TWO.EXPIRY_RANGE | false | R03 violated |
| TWO.ACCEPTANCE_RESET | true | informational on reset; client refreshes state |
| TWO.ILLEGAL_TRANSITION | false | not in PS-015-03 table |

## Authorization
Proposer creates; only system transitions lock and expire.

## Failure, idempotency, concurrency, offline
Evaluation is deterministic on a snapshot; re-evaluated under lock before lock commit.

## Privacy, retention, abuse
Error messages never name counterparties or items.

## Observability & budgets
Counts per code; validation ≤ 30 ms p95 excluding feasibility call.

## Tests
- TEST-PS-015-02-01 (unit): each code on minimal fixture.
- TEST-PS-015-02-02 (integration): superseded offer on accepted slot resets cycle to `proposed`.
- TEST-PS-015-02-03 (integration): infeasible result blocks fully-accepted.

## Acceptance criteria
1. Each code has fixture and message key.
2. No error body includes `par_`, `acc_` or item identifiers of other parties.

## Assumptions & open decisions
- ASSUMPTION: feasibility is required for size 2 too.
- D04 OPEN: partial-acceptance recovery is deferred to F02.S03.
