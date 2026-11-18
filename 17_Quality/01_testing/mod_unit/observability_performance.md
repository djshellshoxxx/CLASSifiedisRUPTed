# PS-137-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_unit. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-137-08.R01 | Unit suite wall-clock time per module reported on every run; p95 <= 5 min for full repository unit suite (ASSUMPTION) | MVP |
| PS-137-08.R02 | Per-test flake rate published; any test with flake rate > 1% over 100 runs is flagged | MVP |
| PS-137-08.R03 | Gate reports count of TEST-PS-IDs unmapped (target 0) and quarantined share (target <= 5%) | MVP |
| PS-137-08.R04 | Metrics exported without fixture values or file contents | MVP |

## Data / schema
Metrics record: `{run_id, module_path, duration_ms, tests_total, tests_failed, tests_quarantined, flaky_ids[], at}`. Flaky IDs are TEST-IDs only.

## Commands / queries / events
Emits `unit.CoverageRecorded` (PS-137-04) and `unit.RunReport`. No query surface beyond CI dashboard.

## States & transitions
Not applicable.

## Validation & errors
Missing metric fields fail the report step with UNIT.REPORT_INCOMPLETE (retryable: yes).

## Authorization
Dashboards readable by engineering roles; raw run logs readable by module developers and QA Lead only.

## Failure, idempotency, concurrency, offline
Report step is idempotent per run_id. If the metrics store is unavailable, the CI run still gates on test results and queues the report for retry (max 24 h).

## Privacy, retention, abuse
Metrics contain no personal data (see PS-137-07). Log redaction applied before storage.

## Observability & budgets
| Metric | Target | Source |
|---|---|---|
| unit suite p95 wall time | <= 5 min | CI runner |
| flaky tests (>1%) | 0 in gate | run report |
| unmapped TEST-IDs | 0 | manifest check |
| quarantined share | <= 5% | manifest |
Targets are ASSUMPTION until baseline measured.

## Tests
- TEST-PS-137-08-01 (unit): report generator fails when `tests_total` missing.
- TEST-PS-137-08-02 (integration): synthetic run with one planted flaky test produces flaky_ids entry.
- TEST-PS-137-08-03 (unit): exported metrics contain no string matching fixture-value patterns.

## Acceptance criteria
1. Budgets table filled with measured baselines within first two sprints of use (future).
2. Flaky detection reproduces planted case in test.
3. Report never contains file contents.

## Assumptions & open decisions
- ASSUMPTION: 5-minute unit suite target; to revisit with mod_load baselines.
- No D-number directly applies; retention of run logs follows D07 PROVISIONAL.
