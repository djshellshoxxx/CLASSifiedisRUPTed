# PS-143-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_gates. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-143-10.R01 | Gate definitions are imported from reviewed repository files validated against CTR-SCH-001. | MVP |
| PS-143-10.R02 | Export contains decisions, evidence IDs and waiver records for a release; no evidence bodies. | MVP |
| PS-143-10.R03 | Rollback of a gate definition is a new version; decisions made under the old version stay valid for that version. | MVP |
| PS-143-10.R04 | Backups restore records only; restore never re-evaluates gates or re-grants waivers. | MVP |

## Notes
- Import: reviewed file, schema check, then `DefineReleaseGate`.
- Export: JSON, for audit and release review.
- Rollback: new definition version; waivers revoked on rollback unless re-approved.

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

## Tests
- TEST-PS-143-10-01 (integration): an imported definition is applied only after review.
- TEST-PS-143-10-02 (integration): backup restore does not re-grant waivers.

## Acceptance criteria
1. TEST-PS-143-10-01, TEST-PS-143-10-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: decision history is retained for audit for the release line plus 1 year.
- D07 (retention) affects backups: PROVISIONAL (D07 default, unapproved).
