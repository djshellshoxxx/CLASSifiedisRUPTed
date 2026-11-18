# PS-145-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_jurisdictions. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-145-08.R01 | Lookup count per region and category per day; no user IDs in metrics. | MVP |
| PS-145-08.R02 | Alert when any restricted-category submission fails closed more than 5 times in 10 minutes (ASSUMPTION). | MVP |

## Budgets
| Metric | Target (ASSUMPTION) |
|---|---|
| Rule lookup, p95 | ≤ 50 ms (cached) |
| Publish visible to listing service, p95 | ≤ 60 s |

## Logs
Region code, rule key, version, outcome. No listing text or user identifiers.

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
- TEST-PS-145-08-01 (unit): metrics carry no user identifiers.
- TEST-PS-145-08-02 (performance): cached rule lookup p95 is at most 50 ms.

## Acceptance criteria
1. TEST-PS-145-08-01, TEST-PS-145-08-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: budgets are internal targets only.
- D05 default applies to metrics granularity: PROVISIONAL (D05 default, unapproved).
