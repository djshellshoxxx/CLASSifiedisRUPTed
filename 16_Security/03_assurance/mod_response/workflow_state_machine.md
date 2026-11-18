# PS-132-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_response. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-FED-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-132-03.R01 | Only transitions in the table are permitted. | MVP |
| PS-132-03.R02 | Execution must start within 5 min of approval or the action `expires` (ASSUMPTION). | MVP |
| PS-132-03.R03 | A `failed` action is retried at most 3 times; then it requires human decision. | MVP |
| PS-132-03.R04 | `rolled_back` is recorded as a new event; the original `executed` record is not edited. | MVP |

## Data / schema
`status` in [domain_schema.md](domain_schema.md).

## Commands / queries / events
Events `response.<past-tense>` (CTR-EVT-001 R10).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | propose | validated | proposed | emit `response.proposed` |
| proposed | approve (1st) | not proposer | proposed | emit `response.approved` (count 1) |
| proposed | approve (2nd) | distinct approver; blast radius rule satisfied | approved | emit `response.approved` (count 2) |
| approved | execute | within 5 min | executing | emit `response.executing` |
| approved | expire | 5 min elapsed | expired | emit `response.expired` |
| executing | complete | effect verified | executed | emit `response.executed` |
| executing | error | step failed | failed | emit `response.failed` |
| failed | retry | attempts < 3 | executing | emit `response.executing` |
| executed | rollback | `reversible` = true; approver | rolled_back | emit `response.rolled_back` |

## Validation & errors
`RESPONSE.TRANSITION_INVALID` (conflict, 409) for other pairs.

## Authorization
Execute guard requires `sys_` executor with capability for the action type.

## Failure, idempotency, concurrency, offline
Executor steps are idempotent. Concurrent execute: one wins under lock.

## Privacy, retention, abuse
Transitions contain no personal data.

## Observability & budgets
Metric `response_action_latency_seconds{action_type}`.

## Tests
- TEST-PS-132-03-01: unit, full table.
- TEST-PS-132-03-02: chaos, executor crash mid-step; restart completes once.

## Acceptance criteria
1. No action reaches `executed` with fewer than required approvers.
2. Expired actions never execute.

## Assumptions & open decisions
- ASSUMPTION: 5-minute execution window, 3 retries.
- D10 (rotation after compromise): PROVISIONAL (D10 default, unapproved).
