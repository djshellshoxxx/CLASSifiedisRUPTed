# PS-017-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_four. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001, CTR-COM-001 (value fields only). Module code `CYCFOUR` (PENDING CTR-ERR-001).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-017-02.R01 | Input must reference a `ccd_` verdict of FEASIBLE with length 4; any other verdict is refused. | MVP |
| PS-017-02.R02 | Four participant refs and four `lst_` refs are pairwise distinct. | MVP |
| PS-017-02.R03 | Every slot's `wants_ref` is satisfied by the next slot's `offer_ref` in the verdict. | MVP |
| PS-017-02.R04 | Proposal is refused if the feasibility verdict is older than its snapshot window (15 min, PS-016-03). | MVP |
| PS-017-02.R05 | Value gap is within the verdict's tolerance; otherwise refused with CYCFOUR.VALUE_GAP (compensation is out of scope here). | MVP |

## Data / schema
Parameters: `length=4` fixed (not configurable); window 15 min (ASSUMPTION).

## Validation & errors
| Code | Category (HTTP) | Retryable | Trigger | details[].rule |
|---|---|---|---|---|
| CYCFOUR.LENGTH_MISMATCH | validation (400) | false | candidate length ≠ 4 | length |
| CYCFOUR.NOT_FEASIBLE | unprocessable_state (422) | false | verdict not FEASIBLE | verdict |
| CYCFOUR.DUPLICATE_PARTICIPANT | validation (400) | false | repeated participant | distinct_participants |
| CYCFOUR.DUPLICATE_LISTING | validation (400) | false | repeated lst_ | distinct_listings |
| CYCFOUR.STALE_VERDICT | precondition_failed (412) | true | verdict outside window | verdict_age |
| CYCFOUR.VALUE_GAP | unprocessable_state (422) | false | gap above tolerance | value_gap |

Messages: `err.cycfour.<code>` keys; no values echoed.

## Authorization
Proposer must be a sys_ matcher or the proposal flow of F02.S01; participants never submit raw cycles.

## Failure, idempotency, concurrency, offline
Validation is deterministic for the same verdict.

## Privacy, retention, abuse
Errors carry no participant refs.

## Observability & budgets
Rejection counters per code.

## Tests
- TEST-PS-017-02-01 (unit): one fixture per code.
- TEST-PS-017-02-02 (negative): 3- and 5-slot inputs return LENGTH_MISMATCH.
- TEST-PS-017-02-03 (boundary): verdict at 15 min passes, at 15 min + 1 s is refused.

## Acceptance criteria
1. Each code produced only by its trigger.
2. No proposal is created from a non-FEASIBLE verdict in 100% of runs.
3. Repeated participants or listings never reach storage.

## Assumptions & open decisions
- ASSUMPTION: 15 min verdict window.
- PROVISIONAL (D03 default, unapproved): integer minor-unit tolerance.
