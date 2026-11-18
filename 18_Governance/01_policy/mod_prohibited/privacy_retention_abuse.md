# PS-146-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 18_Governance/01_policy/mod_prohibited. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-146-07.R01 | Decisions store no listing text, images or free text; `draft_ref` is opaque. | MVP |
| PS-146-07.R02 | Decision reasons are catalogue keys that do not reveal protected attributes. | MVP |
| PS-146-07.R03 | Decisions are kept for 1 year (D07 default, PROVISIONAL) or as long as a linked case is open. | MVP |

## Abuse controls
- **Probing:** repeated classification of small edits to find the boundary is rate-limited to 30 requests per author per hour (ASSUMPTION).
- **Catalogue leakage:** published rule fields are reviewed by F12 for detection content (PS-146-02 R01).
- **Appeals:** restricted and prohibited outcomes carry `case_ref` so an appeal can reach F12.

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
- TEST-PS-146-07-01 (privacy): the decision store is scanned; no listing text or image bytes are present.
- TEST-PS-146-07-02 (unit): decision reasons are catalogue keys only.

## Acceptance criteria
1. TEST-PS-146-07-01, TEST-PS-146-07-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: no automatic account action is taken by this module.
- D07 default: PROVISIONAL (D07 default, unapproved).
