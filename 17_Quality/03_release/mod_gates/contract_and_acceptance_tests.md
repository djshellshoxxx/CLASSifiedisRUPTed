# PS-143-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_gates. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-143-09.R01 | Gate evaluation over the MVP definition set is reproducible: same inputs yield the same outcome. | MVP |
| PS-143-09.R02 | Every blocking path has a test. | MVP |

## Tests
- TEST-PS-143-09-01 (unit): each row of the transition table; other pairs return GATES.INVALID_TRANSITION.
- TEST-PS-143-09-02 (negative): stale CI run from an old commit blocks the gate with GATES.EVIDENCE_STALE.
- TEST-PS-143-09-03 (negative): self-approved waiver rejected with GATES.SELF_APPROVAL_FORBIDDEN.
- TEST-PS-143-09-04 (contract): `gate_decision.recorded` payload matches CTR-EVT-001 envelope.
- TEST-PS-143-09-05 (lint): GATES codes pass CTR-ERR-001 registry lint.
- TEST-PS-143-09-06 (reproducibility): re-running evaluation on pinned evidence yields an identical decision record.

## Acceptance criteria
1. All TEST-PS-143-09-01 to -06 pass.
2. No gate can produce `pass` with a missing or stale evidence item.

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
- ASSUMPTION: evidence fixtures for tests are synthetic.
- D07 default: PROVISIONAL (D07 default, unapproved).
