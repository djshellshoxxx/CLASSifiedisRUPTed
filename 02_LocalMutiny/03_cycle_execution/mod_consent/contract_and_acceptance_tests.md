# PS-021-09 — Contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_consent. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-021-09.R01 | Every example in PS-021-04 validates against its JSON schema in CI. | MVP |
| PS-021-09.R02 | Consumer contract test: mod_lock consumes `cycle.consented` and rejects other inputs. | MVP |
| PS-021-09.R03 | Acceptance scenarios cover 2-party, 3-party and 4-party cycles, each with one revision. | MVP |
| PS-021-09.R04 | Accessibility: consent screen acceptance test with screen reader and keyboard only (WCAG 2.1 AA). | MVP |

## Data / schema
Fixtures: `fixtures/cycle_consent/*.json` (valid, stale, expired, duplicate, non-participant).

## Commands / queries / events
Contract tests drive commands and assert emitted events against CTR-EVT-001 envelope.

## States & transitions
Scenario tests walk the transitions in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Each code in [validation_rules.md](validation_rules.md) has a fixture.

## Authorization
Matrix tests from [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Race and offline scenarios from [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Privacy scan fixtures include seeded `acc_` and `snapshot_hash` values for leak detection.

## Observability & budgets
Test run must emit metrics snapshot for comparison with budgets in PS-021-08.

## Tests
- TEST-PS-021-09-01 (contract): schema examples validate.
- TEST-PS-021-09-02 (e2e): 3-party cycle, all accept → CONSENTED, lock invoked once.
- TEST-PS-021-09-03 (e2e): 4-party cycle, one reject → NOT_CONSENTED, no lock.
- TEST-PS-021-09-04 (a11y): decision controls labelled, announced, operable without pointer.
- TEST-PS-021-09-05 (offline): queued accept shows "pending" until acknowledged.

## Acceptance criteria
1. All TEST-PS-021-09-01..05 pass in CI.
2. Contract tests block merge on schema change without version bump.
3. Acceptance scenarios cover N=2, 3, 4 with one revision each.

## Assumptions & open decisions
- ASSUMPTION: accessibility tooling and screen reader matrix defined by F14 Accessibility Lead.
- [DECISIONS.md](../../../DECISIONS.md) D02 — PROVISIONAL (D02 default, unapproved): fixtures use bounded cycle sizes 2–4 in e2e, 8 in load.
