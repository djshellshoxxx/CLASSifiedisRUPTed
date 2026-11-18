# PS-136-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_property. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-EVT-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-136-06.R01 | A harness crash leaves the run in `error` with its seed; the next run uses the same seed unless told otherwise. | MVP |
| PS-136-06.R02 | Time budget per property: 5 min PR, 60 min nightly (ASSUMPTION); exceeding it is `error` with reason `TIMEOUT`. | MVP |
| PS-136-06.R03 | Generators are pure: no network, no clock reads, no filesystem writes outside the run directory. | MVP |
| PS-136-06.R04 | Counterexample files are written atomically (temp file then rename). | MVP |

## Data / schema
Run directory layout: `runs/<run_id>/seed`, `counterexample.json`, `log.txt`.

## Commands / queries / events
Retry policy for harness errors: 2 retries (ASSUMPTION).

## States & transitions
`error` → `queued` only by explicit re-run.

## Validation & errors
| Code | Category | Retryable | message_key |
|---|---|---|---|
| PROPERTY.TIMEOUT | unavailable (503) | true | err.property.timeout |

## Authorization
N/A.

## Failure, idempotency, concurrency, offline
Properties are CPU-bound and run offline in CI; no external service dependency.

## Privacy, retention, abuse
Run directories are deleted after 30 days (ASSUMPTION) except counterexamples kept 180 days.

## Observability & budgets
Metric `property_timeout_total{property}`.

## Tests
- TEST-PS-136-06-01: chaos, kill harness mid-shrink; counterexample file intact or absent, never partial.
- TEST-PS-136-06-02: timeout produces `error` with reason.

## Acceptance criteria
1. No partial counterexample file observed in 1,000 kill tests.
2. Timeouts never reported as `pass`.

## Assumptions & open decisions
- ASSUMPTION: budgets above.
- D08 not applicable: property tests run offline by design.
