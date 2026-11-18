# PS-077-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_delete (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R06–R08, R12), CTR-EVT-001 (R02, R08), CTR-FED-001 (R07).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-077-03.R01 | Exactly the states `requested`, `cooling_off`, `executing`, `held`, `completed`, `cancelled`, `failed`. `held` and `completed` may coexist per target via completion counts; the request is terminal only when all targets reach `completed`, `held` or `failed`. | MVP |
| PS-077-03.R02 | `cancelled` reachable only from `cooling_off` and only before `cooling_off_until`. | MVP |
| PS-077-03.R03 | `executing` → `failed` after 3 retry rounds across 24 h (ASSUMPTION) with `deletion.failed` event and operator alert. | MVP |
| PS-077-03.R04 | Legal hold on any target moves that target to `held`; other targets continue. | MVP |
| PS-077-03.R05 | Every transition appends one event with `aggregate_revision + 1` (CTR-EVT-001 R02). | MVP |

## Data / schema
State stored on `data_subject_request.state` (PS-077-01). Per-target progress stored in a child table `dsr_target` (`target_id`, `store_class`, `state`, `attempts`, `last_attempt_at`); no content.

## Commands / queries / events
Transitions are triggered by PS-077-04 commands and by the `sys_` executor. Event names: `deletion.requested`, `deletion.cancelled`, `deletion.held`, `deletion.completed`, `deletion.failed`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | request accepted | PS-077-02 pass | requested | Row created; `cooling_off_until` set for account scope |
| requested | window opens | scope is non-account | executing | Executor enqueued |
| requested | window opens | scope is account | cooling_off | Notify subject (generic text) |
| cooling_off | cancel | now < cooling_off_until | cancelled | Terminal; no data touched |
| cooling_off | window elapses | not cancelled | executing | Executor enqueued |
| executing | all stores confirmed | no hold | completed | Completion record written; `record.deleted` |
| executing | hold matched | CTR-PRV-001 R07 scope valid | held | Target frozen; remaining targets continue |
| executing | retries exhausted | R03 | failed | Operator alert; completion lists failures |

## Validation & errors
Invalid transitions return `DEL.INVALID_TRANSITION` (409, not retryable). Cancel after window returns `DEL.CANCEL_WINDOW_CLOSED` (409).

## Authorization
Cancel: subject only (`self`). Executor: `sys_` principal scoped to deletion execution. No `ope_` principal may move a request to `cancelled`.

## Failure, idempotency, concurrency, offline
Transitions use optimistic concurrency on `aggregate_revision`; mismatch → `EVT.REVISION_CONFLICT`. Executor retries use exponential backoff 1 s base, 10 min cap (ASSUMPTION). A `failed` request can be resumed only by an operator with a new `dsr_` linked to it.

## Privacy, retention, abuse
Events carry IDs and counts only (CTR-PRV-001 R12). Held targets are not disclosed to counterparties.

## Observability & budgets
`del_state_total{state}`; `del_propagation_lag_seconds` p95 ≤ 86400 (CTR-PRV-001 metric).

## Tests
- TEST-PS-077-03-01 (property): random event sequences never reach a state outside the table.
- TEST-PS-077-03-02 (integration): hold on one of three targets leaves the other two `completed`.

## Acceptance criteria
1. Every row in the transition table has a test.
2. No path from `completed` or `failed` back to `executing` exists (TEST-PS-077-03-01).
3. Cancel succeeds only inside the window (TEST-PS-077-03-02 variant).

## Assumptions & open decisions
- ASSUMPTION: 72 h cooling-off, 3 retry rounds in 24 h.
- PROVISIONAL (D07 default): hold-driven partial completion.
