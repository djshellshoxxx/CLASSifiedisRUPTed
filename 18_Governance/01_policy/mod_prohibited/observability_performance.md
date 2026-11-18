# PS-146-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_prohibited. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-146-08.R01 | Count of decisions per outcome, per class, per region per day; no user IDs. | MVP |
| PS-146-08.R02 | Track false-positive rate from appeals per class monthly. | MVP |

## Budgets
| Metric | Target (ASSUMPTION) |
|---|---|
| Classification latency, p95 | ≤ 150 ms |
| Appeal-overturned rate per class | flagged to F12 above 10% in a month |
| Fail-closed events | alert if > 5 per 10 minutes |

## Logs
Decision ID, outcome, rule keys and version, region code. No listing content.

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
- TEST-PS-146-08-01 (unit): decision metrics carry no user identifiers.
- TEST-PS-146-08-02 (performance): classification p95 is at most 150 ms.

## Acceptance criteria
1. TEST-PS-146-08-01, TEST-PS-146-08-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: targets are internal.
- No Dxx governs budgets directly: PROVISIONAL, none applied.
