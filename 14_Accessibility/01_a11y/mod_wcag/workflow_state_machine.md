# PS-111-03 — workflow state machine
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_wcag. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-111-03.R01 | A finding is in one of `open`, `in_progress`, `fixed`, `verified`, `accepted_risk`. | MVP |
| PS-111-03.R02 | No finding of severity blocker may be `accepted_risk`. | MVP |
| PS-111-03.R03 | Release gate passes only when zero blocker findings are open or in progress. | MVP |

## Data / schema
Finding `status`, `revision`, `accepted_until`.

## Commands / queries / events
`wcag.finding.transition` emits `accessibility_finding.transitioned`.

## States & transitions
| from | event | guard | to | side effect |
|---|---|---|---|---|
| open | start | owner assigned | in_progress | event |
| in_progress | fix | fix build submitted | fixed | event |
| fixed | verify | QA re-test passes | verified | event |
| fixed | verify fails | — | open | event |
| open or in_progress | accept_risk | severity ≠ blocker; Accessibility Lead approves; accepted_until ≤ 90 days | accepted_risk | event |
| accepted_risk | expiry | date reached | open | event; release gate re-evaluated |

## Validation & errors
See [PS-111-02](validation_rules.md).

## Authorization
See [PS-111-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
See [PS-111-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
No personal data.

## Observability & budgets
Open-blocker count per release is a release metric.

## Tests
- TEST-PS-111-03-01 unit: each row of the table.
- TEST-PS-111-03-02 integration: blocker cannot enter accepted_risk.
- TEST-PS-111-03-03 integration: expiry reopens finding and fails gate.

## Acceptance criteria
1. Transition table exhaustive.
2. Release gate fails in test with one open blocker.
3. Expiry reopens accepted findings in test.

## Assumptions & open decisions
- ASSUMPTION: 90-day maximum acceptance period.
- No Dxx decision directly affects this state machine.
