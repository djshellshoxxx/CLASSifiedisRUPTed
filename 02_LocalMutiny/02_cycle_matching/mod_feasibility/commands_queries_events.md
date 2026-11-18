# PS-016-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_feasibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-ID-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-016-04.R01 | `feasibility.evaluate` is internal; it accepts only `snapshot_id` and `parameters_digest`, and its idempotency key is their concatenation. | MVP |
| PS-016-04.R02 | `feasibility.candidate_get` returns verdict, reason codes and the caller's own slot only. | MVP |
| PS-016-04.R03 | Event `cycle_candidate.evaluated` has `aggregate_type` `cycle_candidate` and revision 1 (first verdict). | MVP |
| PS-016-04.R04 | Evaluate returns within the 10 s hard timeout (ASSUMPTION) or returns BUDGET_EXHAUSTED. | MVP |

## Data / schema
- `feasibility.evaluate`: `{snapshot_id, parameters_digest, budget_steps?}` (budget may only lower the default).
- `feasibility.candidate_get`: `{candidate_id}`.
- Event payload: verdict record (PS-016-01), `max_data_class` = FINANCIAL_EVIDENCE if value present, else LOCATION_COARSE.

## Commands / queries / events
| Operation | Caller | Idempotency | Expected revision | Errors |
|---|---|---|---|---|
| feasibility.evaluate | sys_ | snapshot + digest | null (first) | FEASIBLE.SNAPSHOT_TOO_LARGE, FEASIBLE.BUDGET_EXHAUSTED, SYS.UNAVAILABLE |
| feasibility.candidate_get | participant acc_ | n/a | n/a | SYS.NOT_FOUND |

Versioning: schema 1.0.0; algorithm version in every payload. A change to search rules bumps the algorithm MINOR and re-runs are new evaluations.

## States & transitions
See PS-016-03.

## Validation & errors
See PS-016-02.

## Authorization
See PS-016-05.

## Failure, idempotency, concurrency, offline
Same-key replays return the original verdict (CTR-EVT-001 R03). Retry policy in PS-016-06.

## Privacy, retention, abuse
Payload excludes other participants' IDs from candidate_get responses.

## Observability & budgets
Event lag ≤ 5 s p95 to matching modules (PS-016-08).

## Tests
- TEST-PS-016-04-01 (contract): event validates against 1.0.0.
- TEST-PS-016-04-02 (unit): repeated evaluate with same digest emits one event.
- TEST-PS-016-04-03 (negative): actor calling evaluate directly gets SYS.FORBIDDEN.

## Acceptance criteria
1. Each operation has schema, caller, idempotency rule and errors.
2. `candidate_get` never returns another participant's slot.
3. Event order per candidate follows revision.

## Assumptions & open decisions
- PROVISIONAL (D02 default, unapproved).
- PENDING CTR-EVT-001 subscriber map for F02.S02.M01, M02, M03.
