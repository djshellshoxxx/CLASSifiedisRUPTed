# PS-145-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_jurisdictions. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-145-06.R01 | Decisions record the rule `version` they applied; later withdrawal does not alter them. | MVP |
| PS-145-06.R02 | Publish is atomic per rule version. | MVP |
| PS-145-06.R03 | If the register is unreachable, listing validation for a restricted category fails closed (`SYS.UNAVAILABLE`), never defaults to permitted. | MVP |

## Failure, idempotency, concurrency, offline
- **Register down:** submissions in restricted categories wait; others proceed with the last cached version only if cache age ≤ 24 h (ASSUMPTION).
- **Conflicting publishes:** `expected_revision`; loser gets `SYS.CONFLICT`.
- **Replayed publish event:** consumers dedupe on `(rule_key, version)`.

## Tests
- TEST-PS-145-06-01 (negative): register down with restricted category → `SYS.UNAVAILABLE`, not permitted.
- TEST-PS-145-06-02 (integration): withdrawn rule does not change past decision.

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

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Acceptance criteria
1. the tests above pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: 24-hour cache limit is a default.
- D07 default applies to superseded versions: PROVISIONAL (D07 default, unapproved).
