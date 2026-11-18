# PS-137-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_unit. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-137-06.R01 | A CI runner crash mid-suite leaves no partial coverage row; re-run produces one row per (run_id, module_path) | MVP |
| PS-137-06.R02 | Manifest writes use `revision` compare-and-set; conflicting write returns UNIT.REVISION_CONFLICT with no change | MVP |
| PS-137-06.R03 | Unit suite timeout per module is 10 min; timed-out run is recorded as failed, not skipped | MVP |
| PS-137-06.R04 | Flaky test (fails then passes on retry) is flagged in the run report; automatic retry count is 0 for unit tests | MVP |

## Data / schema
Recovery uses `run_id`, `revision` and `ci_commit` from PS-137-01. No additional tables.

## Commands / queries / events
Retry-safe commands per PS-137-04 idempotency keys. Events on failure: `unit.RunFailed` (run_id, module_path, reason code).

## States & transitions
| from | event | guard | to | side effect |
|---|---|---|---|---|
| running | runner crash | none | failed | discard partial coverage |
| running | timeout 10 min | none | failed | emit unit.RunFailed (UNIT.SUITE_TIMEOUT) |
| failed | re-run | same commit | running | new attempt number |
| running | all pass | none | passed | write coverage once |

## Validation & errors
`UNIT.SUITE_TIMEOUT` (retryable: yes, once), `UNIT.REVISION_CONFLICT` (retryable: after re-read), `UNIT.RUNNER_LOST` (retryable: yes).

## Authorization
Recovery actions run as CI service identity only.

## Failure, idempotency, concurrency, offline
- Retry policy: CI re-run allowed up to 2 times per commit; no in-process retry for unit tests.
- Concurrency: two CI runs on the same commit produce one coverage row (unique key).
- Offline: not applicable; unit runs are local and deterministic, but manifest writes need the central store.

## Privacy, retention, abuse
Failure events contain codes and IDs only; crash dumps with fixture data are redacted before upload (PS-137-07).

## Observability & budgets
Failure rate per module per week; alert at > 5% failed runs for 3 consecutive days (ASSUMPTION).

## Tests
- TEST-PS-137-06-01 (integration): kill runner at 50% of suite; zero coverage rows written.
- TEST-PS-137-06-02 (unit): two MapTest calls with stale revision; one succeeds, one returns REVISION_CONFLICT.
- TEST-PS-137-06-03 (integration): suite exceeding 10 min marked failed with SUITE_TIMEOUT.

## Acceptance criteria
1. Crash and timeout tests pass without partial rows.
2. Concurrent-write test produces exactly one winner.
3. No unit test uses automatic retry; flaky flag present in report.

## Assumptions & open decisions
- ASSUMPTION: 10-minute module suite timeout is adequate for the expected unit suite size.
- D08 is not applicable here (no offline client writes); noted to avoid confusion.
