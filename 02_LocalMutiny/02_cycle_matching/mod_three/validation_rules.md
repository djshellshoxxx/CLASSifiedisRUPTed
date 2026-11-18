# PS-020-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_three. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001. Module code `CYCTHREE` (PENDING CTR-ERR-001).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-020-02.R01 | Input must reference a FEASIBLE `ccd_` verdict with length 3. | MVP |
| PS-020-02.R02 | Three participant refs and three `lst_` refs are pairwise distinct. | MVP |
| PS-020-02.R03 | No listing may be in a locked exchange or another live three-party cycle (checked at proposal and again at lock). | MVP |
| PS-020-02.R04 | Verdict must be younger than 15 min (PS-016-03 window). | MVP |
| PS-020-02.R05 | F06 relevance score may order candidates but never makes an infeasible cycle eligible. | MVP |

## Data / schema
Parameters: `length=3` fixed; window 15 min (ASSUMPTION).

## Validation & errors
| Code | Category (HTTP) | Retryable | Trigger | details[].rule |
|---|---|---|---|---|
| CYCTHREE.LENGTH_MISMATCH | validation (400) | false | length ≠ 3 | length |
| CYCTHREE.NOT_FEASIBLE | unprocessable_state (422) | false | verdict not FEASIBLE | verdict |
| CYCTHREE.DUPLICATE_PARTICIPANT | validation (400) | false | repeated participant | distinct_participants |
| CYCTHREE.LISTING_LOCKED | unprocessable_state (422) | true | listing in locked exchange or live cycle | listing_status |
| CYCTHREE.STALE_VERDICT | precondition_failed (412) | true | verdict older than window | verdict_age |

Messages: `err.cycthree.<code>`; no values echoed.

## Authorization
Proposer is the sys_ matcher; users do not submit cycles.

## Failure, idempotency, concurrency, offline
Deterministic for same input and state.

## Privacy, retention, abuse
Errors carry no candidate refs.

## Observability & budgets
Counts per code.

## Tests
- TEST-PS-020-02-01 (unit): one fixture per code.
- TEST-PS-020-02-02 (negative): length 4 input refused with LENGTH_MISMATCH.
- TEST-PS-020-02-03 (property): relevance score changes order only, never eligibility.

## Acceptance criteria
1. Each code produced only by its trigger.
2. No locked listing reaches a proposal in 100% of runs.
3. Relevance score has no effect on the set of eligible candidates.

## Assumptions & open decisions
- PROVISIONAL (D02 default, unapproved).
