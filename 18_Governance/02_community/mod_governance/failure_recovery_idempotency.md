# PS-147-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/02_community/mod_governance. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-147-06.R01 | Approval IDs are generated once per decision and consumed atomically on publish. | MVP |
| PS-147-06.R02 | A decision is not recorded if its approval ID cannot be issued (all-or-nothing). | MVP |
| PS-147-06.R03 | Publishing with a consumed approval ID returns `GOVERN.APPROVAL_ALREADY_USED`; no second version is created. | MVP |

## Failure, idempotency, concurrency, offline
- **Crash between decision and approval ID issue:** the decision is rolled back; the proposal stays `open`.
- **Duplicate publish:** same approval ID returns original publish result.
- **Rule text changed after decision:** publish rejects a `text_hash` mismatch.

## Tests
- TEST-PS-147-06-01 (integration): crash injected between decide and approval issue leaves proposal open.
- TEST-PS-147-06-02 (unit): approval ID cannot publish twice.

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
- ASSUMPTION: approval IDs expire after 30 days if unused (ASSUMPTION).
- D07 default applies: PROVISIONAL (D07 default, unapproved).
