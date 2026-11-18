# PS-134-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_e2e. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-134-08.R01 | Pass rate per flow and device reported per commit | MVP |
| PS-134-08.R02 | Flake rate per scenario reported; scenario with > 2% flake over 50 runs flagged | MVP |
| PS-134-08.R03 | Full e2e suite wall time <= 25 min with 4 parallel workers (ASSUMPTION) | MVP |
| PS-134-08.R04 | Each of 12 flows has at least one scenario on each device (desktop, phone_360) | MVP |

## Data / schema
Metric record: `{commit, flow, device, passed, failed, errored, skipped, flake_ids[], duration_s, at}`. TEST-IDs only in flake_ids.

## Commands / queries / events
Emits run summary per commit. No new commands.

## States & transitions
Not applicable.

## Validation & errors
Missing device coverage for a flow fails the summary with E2E.COVERAGE_GAP (non-retryable for the commit).

## Authorization
Dashboards readable by engineering roles; artifacts per PS-134-07.

## Failure, idempotency, concurrency, offline
Summary generation idempotent per commit.

## Privacy, retention, abuse
Metric records contain no artifact content.

## Observability & budgets
| Metric | Target |
|---|---|
| main-branch pass rate per flow | >= 98% |
| flaky scenarios in gate | 0 |
| suite wall time | <= 25 min |
| device coverage gaps | 0 |
Targets ASSUMPTION until baseline.

## Tests
- TEST-PS-134-08-01 (unit): summary with missing device flags E2E.COVERAGE_GAP.
- TEST-PS-134-08-02 (integration): planted flaky scenario appears in flake_ids.
- TEST-PS-134-08-03 (performance): 25-scenario sample completes within 6 min at 4 workers (scaled budget).

## Acceptance criteria
1. Summary renders per commit with all 12 flows.
2. Flake detection reproduces planted case.
3. Device coverage gap check blocks merge via mod_gates.

## Assumptions & open decisions
- ASSUMPTION: 4 parallel workers is the CI baseline.
- No direct D-number; D07 PROVISIONAL applies to retention of metric records (1 year).
