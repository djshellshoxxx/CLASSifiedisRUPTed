# PS-135-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_integration. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-ERR-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-135-01.R01 | Each integration scenario has one `scenario` record: ID, contracts covered, modules involved, fixture set ID, owner. | MVP |
| PS-135-01.R02 | Fixture sets are synthetic and versioned; each has a SHA-256 digest. | MVP |
| PS-135-01.R03 | Each `run` record stores commit SHA, scenario ID, environment ID, outcome, duration and failing assertion ID. | MVP |
| PS-135-01.R04 | No fixture contains real personal data, real coordinates, real payment references or production keys. | MVP |

## Data / schema
```json
{
  "scenario_id": "INT-<CONTRACT>-<nn>, e.g. INT-EVT-07",
  "contracts": ["CTR-EVT-001"],
  "modules": ["<full module IDs>"],
  "fixture_set_id": "fx_ (PENDING CTR-ID-001 prefix, proposed fxs, class opaque)",
  "fixture_sha256": "64 hex",
  "run_id": "run_ (PENDING, proposed tst, class ulid)",
  "commit_sha": "40 hex",
  "environment_id": "string (closed list: ci-ephemeral, staging-seeded)",
  "outcome": "pass | fail | skipped | flaky_quarantined",
  "failing_assertion": "TEST-PS-... | null",
  "duration_ms": "integer",
  "data_class": "PUBLIC"
}
```
Synthetic data only, so class is PUBLIC; the rule in PS-135-01.R04 is enforced by lint, not by classification.

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
Test results are readable by all engineers; fixture write access is limited to QA Lead (F17) and module owners.

## Failure, idempotency, concurrency, offline
Runs are append-only. Re-running a scenario creates a new `run_id`.

## Privacy, retention, abuse
Fixture lint blocks any value matching personal-data patterns (email, phone, coordinates at street precision).

## Observability & budgets
Suite duration tracked per scenario (see [observability_performance.md](observability_performance.md)).

## Tests
- TEST-PS-135-01-01: unit, scenario record schema.
- TEST-PS-135-01-02: lint, personal-data patterns blocked in fixtures.

## Acceptance criteria
1. Every scenario record references at least one canonical contract ID.
2. Fixture digest matches on every run.

## Assumptions & open decisions
- ASSUMPTION: fixture prefix `fxs` and run prefix `tst` are proposals, PENDING CTR-ID-001.
- D08 (offline queue scenarios): PROVISIONAL (D08 default, unapproved).
