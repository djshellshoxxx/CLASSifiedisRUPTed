# PS-136-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_property. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-ID-001, CTR-FED-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-136-10.R01 | Property definitions are versioned in the repository; changes go through review. | MVP |
| PS-136-10.R02 | Counterexample exports are synthetic-only and carry the seed. | MVP |
| PS-136-10.R03 | Rollback of a property change restores the previous definition by new commit; history kept. | MVP |
| PS-136-10.R04 | No import of counterexamples from production systems. | MVP |

## Data / schema
Export manifest: `property_id`, `version`, `seed`, `build_sha`.

## Commands / queries / events
N/A beyond registry operations.

## States & transitions
N/A.

## Validation & errors
Production-origin input rejected with `PROPERTY.GENERATOR_INVALID`.

## Authorization
Export requires `property.replay`.

## Failure, idempotency, concurrency, offline
Replay is idempotent on counterexample ID.

## Privacy, retention, abuse
Exports carry synthetic values only.

## Observability & budgets
Counter `property_export_total`.

## Tests
- TEST-PS-136-10-01: export replays identically on a clean checkout.
- TEST-PS-136-10-02: production-origin counterexample import rejected.

## Acceptance criteria
1. Replay from export reproduces failure in 100% of fixtures.
2. Zero production-origin imports accepted.

## Assumptions & open decisions
- ASSUMPTION: manifest format is a JSON file in the repository.
- D07 (counterexample retention): PROVISIONAL (D07 default, unapproved).
