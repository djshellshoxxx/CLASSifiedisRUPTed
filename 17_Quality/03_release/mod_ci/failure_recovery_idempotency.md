# PS-141-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_ci. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (idempotency keys), CTR-ERR-001 (retry rules).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-141-06.R01 | Job timeout defaults to 45 minutes for PR pipelines and 90 minutes for release pipelines (ASSUMPTION). | MVP |
| PS-141-06.R02 | A run lost to runner failure is retried once as a new `attempt`; a second loss ends `aborted_infra`. | MVP |
| PS-141-06.R03 | Test assertion failures are never retried automatically. Re-running to hide a failure requires a logged maintainer action. | MVP |
| PS-141-06.R04 | Duplicate `StartCiRun` with the same key returns the original run; no second run is dispatched. | MVP |

## Failure, idempotency, concurrency, offline
- **Partial job results:** a job that reports artifact digests and then fails is recorded `failed`; its digests are kept but cannot satisfy a gate.
- **Flaky tests:** a test that fails and passes on rerun is recorded as two attempts with a `flake` tag. It does not turn the first attempt into `passed`.
- **Concurrent pipeline edits:** `DefineCiPipeline` uses `expected_revision`; the loser gets `SYS.CONFLICT`.
- **Cache poisoning:** caches are keyed by branch and lockfile digest; fork-run caches are never read by main-branch runs.
- **Network loss at runner:** the runner retries result upload with backoff 10 s, 60 s, 300 s (ASSUMPTION), then marks the job `aborted_infra`.

## Validation & errors
Retryable: `SYS.UNAVAILABLE` (503), `SYS.RATE_LIMITED` (429). Non-retryable: `CIPIPE.*`, `SYS.CONFLICT`.

## Tests
- TEST-PS-141-06-01 (integration): duplicate webhook yields one run.
- TEST-PS-141-06-02 (integration): runner killed mid-job yields `aborted_infra` after one retry.
- TEST-PS-141-06-03 (unit): flaky test shows two attempts with `flake` tag; first attempt stays `failed`.
- TEST-PS-141-06-04 (concurrency): two definition edits at the same revision; one wins.

## Assumptions & open decisions
- ASSUMPTION: timeout and backoff values are defaults for the reference provider.
- D07 (retention) affects how long aborted run logs are kept: PROVISIONAL (D07 default, unapproved).
