# PS-144-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_goods. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-144-08.R01 | Count of listings per category and per deprecated key is reported daily. | MVP |
| PS-144-08.R02 | Taxonomy read latency is measured per version. | MVP |

## Budgets
| Metric | Target (ASSUMPTION) |
|---|---|
| Taxonomy fetch, p95 | ≤ 100 ms (cached) |
| Publish to visible, p95 | ≤ 60 s |
| Listings on deprecated keys after migration deadline | 0 |

## Logs
Category key, version, outcome. No listing content.

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
- TEST-PS-144-08-01 (unit): listing counts per category are reported daily.
- TEST-PS-144-08-02 (performance): cached taxonomy fetch p95 is at most 100 ms.

## Acceptance criteria
1. TEST-PS-144-08-01, TEST-PS-144-08-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: deprecated-key migration deadline is 90 days.
- No Dxx governs budgets directly: PROVISIONAL, none applied.
