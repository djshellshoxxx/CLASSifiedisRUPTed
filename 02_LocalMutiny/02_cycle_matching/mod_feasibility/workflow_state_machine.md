# PS-016-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_feasibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R09), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-016-03.R01 | A snapshot is `open` until sealed, then immutable; sealed snapshots expire 15 min after sealing (ASSUMPTION). | MVP |
| PS-016-03.R02 | A candidate is `generated` → `evaluating` → exactly one of FEASIBLE, INFEASIBLE, BUDGET_EXHAUSTED. | MVP |
| PS-016-03.R03 | A verdict is final for its (snapshot_id, algorithm_version); re-evaluation yields the same verdict or is rejected. | MVP |
| PS-016-03.R04 | Each verdict emits one `cycle_candidate.evaluated` event in the same commit. | MVP |

## Data / schema
State in `verdict` and `snapshot.status` (PS-016-01). Events carry revision per candidate.

## Commands / queries / events
Transitions triggered by `feasibility.evaluate` only (PS-016-04).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | snapshot.seal | ≤ 5,000 edges; PS-016-02 snapshot rules | snapshot sealed | snapshot hash fixed |
| generated | evaluate start | snapshot sealed and not expired | evaluating | none |
| evaluating | search complete, all constraints pass | — | FEASIBLE | emit event |
| evaluating | constraint fails | reason recorded | INFEASIBLE | emit event |
| evaluating | step budget reached | — | BUDGET_EXHAUSTED | emit event; never FEASIBLE |
| sealed | 15 min elapsed | — | snapshot expired | candidates kept for 24 h RET-EPH |
| any verdict | evaluate with same digest | — | unchanged | no new event |

## Validation & errors
Guards use PS-016-02 codes; invalid transition returns `FEASIBLE.ENDPOINT_INACTIVE` or SYS.UNPROCESSABLE_STATE as appropriate.

## Authorization
Only sys_ evaluator (PS-016-05).

## Failure, idempotency, concurrency, offline
Not offline: evaluation is server-side only. Concurrency handled by immutable snapshots.

## Privacy, retention, abuse
Expired snapshots are purged within 24 h, leaving verdict and reason codes.

## Observability & budgets
Transition counters in PS-016-08.

## Tests
- TEST-PS-016-03-01 (unit): every table row.
- TEST-PS-016-03-02 (property): no path from BUDGET_EXHAUSTED to FEASIBLE on the same digest.
- TEST-PS-016-03-03 (integration): expired snapshot rejects evaluation.

## Acceptance criteria
1. Every candidate ends in exactly one verdict.
2. Re-evaluation with the same digest produces zero new events.
3. Expired snapshots accept no new evaluations.

## Assumptions & open decisions
- PROVISIONAL (D02 default, unapproved): deterministic search with explicit budget.
