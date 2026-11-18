# PS-135-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_integration. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-ERR-001, CTR-SCH-001, CTR-FED-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-135-09.R01 | Scenario INT-EVT-01: producer emits event, consumer applies it exactly once under duplicate delivery (CTR-EVT-001 R03). | MVP |
| PS-135-09.R02 | Scenario INT-CAP-01: a grant revoked at time T denies action at T+1 (CTR-CAP-001 R09). | MVP |
| PS-135-09.R03 | Scenario INT-ERR-01: every error code returned by a module matches CTR-ERR-001 envelope and category map. | MVP |
| PS-135-09.R04 | Scenario INT-SCH-01: old-version producer and new-version consumer interoperate within MINOR (CTR-SCH-001 R05). | MVP |
| PS-135-09.R05 | Scenario INT-FED-01: relay delivers batch, dedupe on (origin, event_id), equivocation quarantine (CTR-FED-001 R05, R06). | MVP |
| PS-135-09.R06 | Scenario INT-COM-01: commerce claim moves through states and never reaches FINAL for cash (CTR-COM-001 R07). | MVP |

## Data / schema
Scenario definitions reference contracts by ID; contracts are not redefined here.

## Commands / queries / events
Scenarios drive commands listed in each module's PS-xxx-04.

## States & transitions
Scenario runs follow [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
INT-ERR-01 covers [validation_rules.md](validation_rules.md).

## Authorization
INT-CAP-01 covers PS-135-05.

## Failure, idempotency, concurrency, offline
INT-EVT-01 includes duplicate delivery and out-of-order revision.

## Privacy, retention, abuse
Synthetic data per PS-135-07.

## Observability & budgets
Full set ≤ 15 min.

## Tests
- TEST-PS-135-09-01: INT-EVT-01.
- TEST-PS-135-09-02: INT-CAP-01.
- TEST-PS-135-09-03: INT-ERR-01.
- TEST-PS-135-09-04: INT-SCH-01.
- TEST-PS-135-09-05: INT-FED-01.
- TEST-PS-135-09-06: INT-COM-01.

## Acceptance criteria
1. All six scenarios pass on the release candidate.
2. Each scenario maps to at least one CTR-* ID and one owning module.

## Assumptions & open decisions
- ASSUMPTION: scenario IDs and counts above.
- D01 (federation relay wire format) and D04 (partial barter): PROVISIONAL (default, unapproved).
