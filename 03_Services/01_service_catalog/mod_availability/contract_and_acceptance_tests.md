# PS-028-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/01_service_catalog/mod_availability. **Parent:** [mod_availability SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-SCH-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-028-09.R01 | Contract tests validate every command and event against CTR-SCH-001 schemas. | MVP |
| PS-028-09.R02 | Booking flow test: create window → hold by quote → accept → booked; then decline path releases hold. | MVP |
| PS-028-09.R03 | DST fixtures for Europe/Berlin, America/New_York and Australia/Lord_Howe. | MVP |
| PS-028-09.R04 | Accessibility: slot picker operable by keyboard; each slot announced with date, local time and availability state. | MVP |

## Data / schema
Fixtures: `fixtures/svcavail/dst_spring_gap.json`, `capacity_one_race.json`, `ics_mixed_valid_invalid.json` (names proposed; created in implementation phase). Each pins timezone database version.

## Commands / queries / events
Replay of recorded quote events through the hold and release state machine.

## States & transitions
Each state in PS-028-03 has positive and negative tests.

## Validation & errors
Error-code coverage 100% for SVCAVAIL codes.

## Authorization
Matrix tests from PS-028-05 included.

## Failure, idempotency, concurrency, offline
Chaos: duplicate quote events, clock skew of ±2 min between nodes, timer restart.

## Privacy, retention, abuse
Fixtures use synthetic accounts and no real addresses. Test data purged after run.

## Observability & budgets
Suite ≤ 10 min in CI (ASSUMPTION).

## Tests
- TEST-PS-028-09-01 (contract): all commands and events validate.
- TEST-PS-028-09-02 (e2e): create → hold → accept → booked.
- TEST-PS-028-09-03 (property): recurrence expansion over 366 days never produces overlapping occurrences for capacity 1.
- TEST-PS-028-09-04 (a11y): slot picker passes keyboard and announcement checks.
- TEST-PS-028-09-05 (unit): ICS with 256 KB + 1 byte rejected.

## Acceptance criteria
1. All DST fixtures pass for the three zones.
2. Booking flow e2e passes including decline release.
3. Error-code coverage 100%.

## Assumptions & open decisions
- ASSUMPTION: WCAG 2.1 AA as the CI accessibility mapping.
- OPEN: timezone database update policy (see PS-028-10). See [DECISIONS.md](../../../DECISIONS.md) D05.
