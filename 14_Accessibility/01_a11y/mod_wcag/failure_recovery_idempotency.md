# PS-111-06 — failure, recovery, idempotency and concurrency
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_wcag. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-111-06.R01 | CI submission retries up to 3 times with same key; failure fails the pipeline, not the gate. | MVP |
| PS-111-06.R02 | Concurrent transitions on one finding: second request gets `WCAG.STALE_REVISION`. | MVP |
| PS-111-06.R03 | Expired accepted risk reopens the finding automatically at the expiry time. | MVP |

## Data / schema
Revision on each finding.

## Commands / queries / events
Retries reuse the same key ([PS-111-04](commands_queries_events.md)).

## States & transitions
Expiry transition per [PS-111-03](workflow_state_machine.md).

## Validation & errors
Stale revision per [PS-111-02](validation_rules.md).

## Authorization
Expiry job runs as `sys_` with transition-only scope.

## Failure, idempotency, concurrency, offline
| Scenario | Behavior |
|---|---|
| CI cannot reach backend | Build artifact holds submission; upload retried next run |
| Concurrent transitions | Revision check; one winner |
| Expiry job missed | Gate reads expiry at query time, so gate fails regardless |

## Privacy, retention, abuse
Not applicable.

## Observability & budgets
Expiry job lag reported; target < 1 h (ASSUMPTION).

## Tests
- TEST-PS-111-06-01 integration: two concurrent transitions, one succeeds.
- TEST-PS-111-06-02 integration: expiry at boundary reopens finding.
- TEST-PS-111-06-03 fault: backend unavailable during CI submit.

## Acceptance criteria
1. No accepted finding survives past its expiry in the gate.
2. Concurrency test shows exactly one winner.

## Assumptions & open decisions
- ASSUMPTION: gate evaluates expiry at read time.
- No Dxx decision directly affects this process.
