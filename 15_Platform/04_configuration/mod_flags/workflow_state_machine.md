# PS-124-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/04_configuration/mod_flags (F15.S04.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-124-03.R01 | Flag states: `defined`, `ramping`, `on`, `off`, `expired`, `retired`. | MVP |
| PS-124-03.R02 | A kill switch sets state `off` immediately and cannot be overridden by rules until cleared by an approver. | MVP |
| PS-124-03.R03 | `expired` reverts evaluation to `default_value` and emits an event; no other state change is automatic. | MVP |
| PS-124-03.R04 | `retired` flags evaluate to default and their key is reserved. | MVP |

## Data / schema
`state` derived from `rollout_bp`, `kill_switch` and `expires_at`. Events: `flag.created`, `flag.updated`, `flag.killed`, `flag.expired`, `flag.retired` (CTR-EVT-001, aggregate `flag`).

## Commands / queries / events
`flag.create`, `flag.update`, `flag.kill`, `flag.clear_kill`, `flag.retire` (PS-124-04).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | create | PS-124-02 passes | defined | emit `flag.created` |
| defined | update rollout > 0 | R05 and R06 pass | ramping | emit `flag.updated` |
| ramping | update rollout = 10000 | approver recorded | on | emit `flag.updated` |
| ramping or on | update rollout = 0 | — | off | emit `flag.updated` |
| any non-retired | kill | any `ope` or `sys` on-call | off (kill_switch true) | emit `flag.killed`; ≤ 60 s propagation |
| off (killed) | clear_kill | second `ope` approver | prior state | emit `flag.updated` |
| any non-retired | expires_at reached | — | expired | emit `flag.expired`; default value applies |
| off or expired | retire | feature `deprecated` or `retired` | retired | emit `flag.retired` |

## Validation & errors
Illegal transitions: `SYS.CONFLICT`.

## Authorization
Kill is allowed without approval (emergency); clear_kill needs a second approver (PS-124-05).

## Failure, idempotency, concurrency, offline
Revision check on every change; kill is idempotent.

## Privacy, retention, abuse
Events carry flag key and state only.

## Observability & budgets
Metric: `flag_state_transitions_total{from,to}`; alert on any kill (page on-call).

## Tests
- TEST-PS-124-03-01 (unit): transitions table; illegal refused.
- TEST-PS-124-03-02 (e2e): kill propagates to all nodes ≤ 60 s.
- TEST-PS-124-03-03 (integration): expiry reverts to default without an operator action.
- TEST-PS-124-03-04 (negative): clear_kill by the same person who killed refused.

## Acceptance criteria
1. Kill propagation SLO met (TEST-02).
2. TEST-PS-124-03-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 60 s kill propagation.
