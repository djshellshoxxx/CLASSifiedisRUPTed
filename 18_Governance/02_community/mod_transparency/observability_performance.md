# PS-148-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_transparency. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-148-08.R01 | Track days from period end to publication per report; alert at 25 days (ASSUMPTION). | MVP |
| PS-148-08.R02 | Count suppressed cells per metric per report and show the trend to the Privacy Lead. | MVP |

## Budgets
| Metric | Target (ASSUMPTION) |
|---|---|
| Draft generation for a quarter, p95 | ≤ 10 min |
| Published report read, p95 | ≤ 300 ms (cached) |
| Publication deadline | ≤ 30 days after period end |

## Logs
Report ID, metric keys, suppressed count. No figure values in logs beyond aggregate counts.

## Data / schema
Not applicable to this process; owned by [domain_schema](domain_schema.md).

## Commands / queries / events
Not applicable to this process; owned by [commands_queries_events](commands_queries_events.md).

## States & transitions
Not applicable to this process; owned by [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Not applicable to this process; owned by [validation_rules](validation_rules.md).

## Authorization
Not applicable to this process; owned by [authorization_capabilities](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Not applicable to this process; owned by [failure_recovery_idempotency](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Tests
- TEST-PS-148-08-01 (unit): an alert fires at 25 days after period end without publication.
- TEST-PS-148-08-02 (performance): a quarter draft completes with p95 at most 10 min.

## Acceptance criteria
1. TEST-PS-148-08-01, TEST-PS-148-08-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: budgets are internal.
- D05 default applies to region metrics: PROVISIONAL (D05 default, unapproved).
