# PS-136-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_property. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-COM-001, CTR-EVT-001, CTR-PRV-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-136-09.R01 | PROP-ID-01: every generated ID has length 30, valid prefix, body first char 0–7, Crockford alphabet (CTR-ID-001 R01, R04). | MVP |
| PS-136-09.R02 | PROP-COM-01: money addition and subtraction on minor units is exact for all values within 39 digits; no float appears (CTR-COM-001 R02). | MVP |
| PS-136-09.R03 | PROP-EVT-01: revisions for one aggregate are contiguous and strictly increase by 1 (CTR-EVT-001 R02). | MVP |
| PS-136-09.R04 | PROP-PRV-01: no coarse-cell publication below K_MIN active items; merging preserves total counts (CTR-PRV-001 R04). | MVP |
| PS-136-09.R05 | PROP-SCH-01: any two compatible schema versions round-trip the MINOR-added fields (CTR-SCH-001 R05). | MVP |
| PS-136-09.R06 | PROP-CYC-01: cycle solutions never allocate a listing twice and include each party at most once (D02). | MVP |

## Data / schema
Property definitions reference contracts by ID.

## Commands / queries / events
Covered by [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Covered by [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Covered by [validation_rules.md](validation_rules.md).

## Authorization
Covered by [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Covered by [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Covered by [privacy_retention_abuse.md](privacy_retention_abuse.md).

## Observability & budgets
Covered by [observability_performance.md](observability_performance.md).

## Tests
- TEST-PS-136-09-01: PROP-ID-01, 1,000 cases PR, 100,000 nightly.
- TEST-PS-136-09-02: PROP-COM-01, same budgets.
- TEST-PS-136-09-03: PROP-EVT-01, same budgets.
- TEST-PS-136-09-04: PROP-PRV-01, same budgets.
- TEST-PS-136-09-05: PROP-SCH-01, same budgets.
- TEST-PS-136-09-06: PROP-CYC-01, same budgets.

## Acceptance criteria
1. All six properties pass nightly at 100,000 cases.
2. Each property has a counterexample replay test.

## Assumptions & open decisions
- ASSUMPTION: K_MIN = 5 from CTR-PRV-001.
- D02 and D03 default governs PROP-CYC-01 and PROP-COM-01: PROVISIONAL (default, unapproved).
