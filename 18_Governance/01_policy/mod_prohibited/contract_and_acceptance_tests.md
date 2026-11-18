# PS-146-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_prohibited. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-146-09.R01 | Classification order is prohibited, restricted, then permitted for every fixture. | MVP |
| PS-146-09.R02 | No stored decision contains listing text. | MVP |

## Tests
- TEST-PS-146-09-01 (unit): prohibited rule and restricted rule both match → outcome prohibited.
- TEST-PS-146-09-02 (negative): rule payload with regex rejected with PROHIB.DETECTION_FIELD_FORBIDDEN.
- TEST-PS-146-09-03 (privacy): decision record scanned; no free-text field present.
- TEST-PS-146-09-04 (integration): restricted outcome routes draft to F12 queue with case_ref.
- TEST-PS-146-09-05 (lint): PROHIB codes pass CTR-ERR-001 registry lint.

## Acceptance criteria
1. All TEST-PS-146-09-01 to -05 pass.
2. Catalogue v1 contains no detection fields.

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

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Assumptions & open decisions
- ASSUMPTION: fixtures are synthetic listing drafts.
- D07 default: PROVISIONAL (D07 default, unapproved).
