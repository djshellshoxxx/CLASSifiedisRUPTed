# PS-018-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_n. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001, CTR-COM-001 (value fields only). Module code `CYCLEN` (PENDING CTR-ERR-001).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-018-02.R01 | `max_length` must be 5..8; lower values route to mod_three or mod_four and are refused here. | MVP |
| PS-018-02.R02 | The snapshot must be sealed and FEASIBLE-sourced (PS-016-03); run on an open snapshot is refused. | MVP |
| PS-018-02.R03 | `budget_steps` ∈ [10,000, 200,000] (ASSUMPTION); values outside are refused. | MVP |
| PS-018-02.R04 | `candidate_cap` ∈ [1, 1,000]. | MVP |
| PS-018-02.R05 | A run is refused if the snapshot exceeds 5,000 edges (FEASIBLE rule reused). | MVP |

## Data / schema
Parameter defaults: `max_length=8`, `budget_steps=200000`, `candidate_cap=1000` (ASSUMPTION; D02 default).

## Validation & errors
| Code | Category (HTTP) | Retryable | Trigger | details[].rule |
|---|---|---|---|---|
| CYCLEN.LENGTH_OUT_OF_RANGE | validation (400) | false | max_length outside 5..8 | length_bounds |
| CYCLEN.ROUTED_ELSEWHERE | validation (400) | false | length 2–4 requested here | routing |
| CYCLEN.BUDGET_OUT_OF_RANGE | validation (400) | false | budget or cap outside bounds | budget_bounds |
| CYCLEN.SNAPSHOT_NOT_SEALED | precondition_failed (412) | true | snapshot still open | snapshot_status |
| CYCLEN.BUDGET_EXHAUSTED | unprocessable_state (422) | false | step budget reached; no output kept | budget_steps |

Messages: `err.cyclen.<code>`; no values echoed.

## Authorization
Sys_ matcher only; users cannot request runs.

## Failure, idempotency, concurrency, offline
Same snapshot and parameters always yield the same validation result.

## Privacy, retention, abuse
Errors carry no candidate refs.

## Observability & budgets
Counts per code.

## Tests
- TEST-PS-018-02-01 (unit): one fixture per code.
- TEST-PS-018-02-02 (boundary): max_length 4 refused, 5 accepted, 8 accepted, 9 refused.
- TEST-PS-018-02-03 (negative): run on open snapshot refused.

## Acceptance criteria
1. Routing refusal occurs for lengths 2–4 in 100% of runs.
2. Boundary values match the ranges above.
3. No candidate content in any error.

## Assumptions & open decisions
- ASSUMPTION: budget and cap ranges above.
- PROVISIONAL (D02 default, unapproved).
