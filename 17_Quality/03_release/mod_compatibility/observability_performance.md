# PS-142-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_compatibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-142-08.R01 | Each matrix cell shows its last result date and outcome on the release dashboard. | MVP |
| PS-142-08.R02 | Cells without a result in 14 days are highlighted as stale. | MVP |

## Budgets
| Metric | Target (ASSUMPTION) |
|---|---|
| Full MVP matrix run time | ≤ 6 h |
| Result visible after recording | ≤ 30 s, p95 |
| Cells with `not_run` on a release candidate | 0 for supported rows |

## Logs
Allowlist: matrix key, row key, outcome, commit SHA prefix. No device identifiers.

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
- TEST-PS-142-08-01 (unit): a cell without a result for 14 days is highlighted as stale.
- TEST-PS-142-08-02 (performance): full MVP matrix run completes within the 6 h budget.

## Acceptance criteria
1. TEST-PS-142-08-01, TEST-PS-142-08-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: the MVP matrix has up to 40 rows.
- No Dxx governs these budgets directly: D01 applies to peer-protocol rows only: PROVISIONAL (D01 default, unapproved).
