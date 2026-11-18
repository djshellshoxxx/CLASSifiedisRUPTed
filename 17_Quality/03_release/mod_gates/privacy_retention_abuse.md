# PS-143-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_gates. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-143-07.R01 | Gate records store evidence IDs and digests only; no user data, device data or log text. | MVP |
| PS-143-07.R02 | Waiver `reason_key` refers to a catalogue entry; free text is not stored. | MVP |
| PS-143-07.R03 | Decision and waiver records are kept for the release line plus 1 year (D07 default, PROVISIONAL); legal holds extend retention. | MVP |

## Abuse controls
- **Waiver farming:** more than 3 waivers per gate per release line need Governance Lead review (ASSUMPTION).
- **Gate weakening:** removal of evidence types needs Governance approval (PS-143-02 R01).
- **Evidence swap:** digests make substitution detectable (PS-143-02 R02).

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

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Tests
- TEST-PS-143-07-01 (privacy): decision records contain IDs and digests only.
- TEST-PS-143-07-02 (unit): a reason outside the catalogue is rejected.

## Acceptance criteria
1. TEST-PS-143-07-01, TEST-PS-143-07-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: privacy and accessibility sign-off records contain no personal data beyond approver IDs.
- D07 default: PROVISIONAL (D07 default, unapproved).
