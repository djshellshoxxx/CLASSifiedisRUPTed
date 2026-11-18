# PS-144-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_goods. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-144-06.R01 | Publish is atomic per taxonomy version: all categories in the version are visible together or none are. | MVP |
| PS-144-06.R02 | Listing migration after deprecation is idempotent per listing ID. | MVP |
| PS-144-06.R03 | Readers that cache a taxonomy version keep it until a newer version is published; they never mix versions. | MVP |

## Failure, idempotency, concurrency, offline
- **Partial migration:** listings already moved keep the new key; unmoved listings keep the deprecated key, which stays valid (R03 of PS-144-03).
- **Concurrent edits:** `expected_revision`; loser gets `SYS.CONFLICT`.
- **Rollback:** a new version reinstating earlier keys; keys are never reused.
- **Offline clients:** may hold one cached version; new listings are validated online at submit.

## Tests
- TEST-PS-144-06-01 (integration): publish failure leaves prior version visible.
- TEST-PS-144-06-02 (integration): migration re-run moves no listing twice.

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
- ASSUMPTION: migration runs are owned by F01.
- D07 default applies to superseded versions: PROVISIONAL (D07 default, unapproved).
