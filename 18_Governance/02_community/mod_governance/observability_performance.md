# PS-147-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_governance. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-147-08.R01 | Count of proposals by status and days-to-decision, reported monthly. | MVP |
| PS-147-08.R02 | Approval IDs unused after 30 days are listed for steward review. | MVP |

## Budgets
| Metric | Target (ASSUMPTION) |
|---|---|
| Proposal open or decide response, p95 | ≤ 500 ms |
| Median days to decision | ≤ 14 |

## Logs
Proposal ID, status, rule key, approval ID hash. No reasons beyond keys, no votes.

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
- TEST-PS-147-08-01 (unit): monthly proposal counts are reported by status.
- TEST-PS-147-08-02 (performance): open and decide responses p95 are at most 500 ms.

## Acceptance criteria
1. TEST-PS-147-08-01, TEST-PS-147-08-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: budgets are internal.
- No Dxx governs budgets directly: PROVISIONAL, none applied.
