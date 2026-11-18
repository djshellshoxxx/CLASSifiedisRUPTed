# PS-146-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_prohibited. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-146-06.R01 | Classification fails closed: no decision on error means the draft cannot be submitted. | MVP |
| PS-146-06.R02 | Same `(draft_ref, draft_version, region_code)` returns the original decision. | MVP |
| PS-146-06.R03 | Rule publish is atomic; a classification uses only published versions. | MVP |

## Failure, idempotency, concurrency, offline
- **Retry:** `SYS.UNAVAILABLE` retried by the listing service with backoff 1 s, 4 s, 16 s (ASSUMPTION), same key.
- **Rule changed between draft versions:** the new draft version is classified against the current rules.
- **Concurrent publishes:** `expected_revision`; loser gets `SYS.CONFLICT`.
- **Replayed events:** consumers dedupe on `decision_id`.

## Tests
- TEST-PS-146-06-01 (negative): rule service down → `SYS.UNAVAILABLE`, draft not submitted.
- TEST-PS-146-06-02 (integration): duplicate classification request returns original decision.

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
- ASSUMPTION: backoff values are defaults.
- D07 default applies: PROVISIONAL (D07 default, unapproved).
