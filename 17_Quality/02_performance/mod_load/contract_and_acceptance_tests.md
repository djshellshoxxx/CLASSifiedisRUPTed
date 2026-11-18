# PS-139-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_load. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-FED-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-139-09.R01 | Reference profiles LD-01 (steady, 200 rps, 30 min), LD-02 (ramp to 1,000 rps), LD-03 (spike ×3 for 2 min), LD-04 (soak 4 h at 300 rps). | MVP |
| PS-139-09.R02 | Every error response observed under load matches CTR-ERR-001 envelope. | MVP |
| PS-139-09.R03 | Relay batch ingest under LD-02 respects CTR-FED-001 batch limits. | MVP |
| PS-139-09.R04 | Region query load respects CTR-PRV-001 K_MIN and budget. | MVP |

## Data / schema
Profile definitions in repository.

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
- TEST-PS-139-09-01: LD-01 steady state within SLO.
- TEST-PS-139-09-02: LD-02 ramp, no unhandled 5xx.
- TEST-PS-139-09-03: LD-03 spike, rate limiting engages and recovers.
- TEST-PS-139-09-04: LD-04 soak, no memory growth above 10% over 4 h (ASSUMPTION).
- TEST-PS-139-09-05: error envelope conformance under load.

## Acceptance criteria
1. LD-01 to LD-04 pass on the release candidate.
2. Zero envelope violations across all runs.

## Assumptions & open decisions
- ASSUMPTION: profile numbers above.
- D01 and D05 defaults govern LD-02 and region query portions: PROVISIONAL (default, unapproved).
