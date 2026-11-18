# PS-139-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/02_performance/mod_load. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-139-08.R01 | Report p50, p95, p99 latency and error rate per operation ID. | MVP |
| PS-139-08.R02 | Compare each run to the baseline run for the same build line; flag regressions > 10% on p95 (ASSUMPTION). | MVP |
| PS-139-08.R03 | Gate release on SLO: p95 for each operation in its budget and error rate ≤ 0.5% (ASSUMPTION). | MVP |
| PS-139-08.R04 | Harness metrics separate from system metrics. | MVP |

## Data / schema
Labels: `operation_id`, `profile`, `environment_id`.

## Commands / queries / events
N/A.

## States & transitions
N/A.

## Validation & errors
N/A.

## Authorization
Dashboards readable by engineers and SRE.

## Failure, idempotency, concurrency, offline
Harness metric loss marks the run `failed` (PS-139-03).

## Privacy, retention, abuse
No personal data in metrics.

## Observability & budgets
| Operation class | p95 target (ASSUMPTION) |
|---|---|
| Listing read | ≤ 300 ms |
| Message send | ≤ 500 ms |
| Region query | ≤ 400 ms |
| Relay batch ingest (100 events) | ≤ 1 s |
| Error rate | ≤ 0.5% |

## Tests
- TEST-PS-139-08-01: load, reference profile meets all targets on staging.
- TEST-PS-139-08-02: regression detection, injected 15% slowdown is flagged.

## Acceptance criteria
1. Reference profile passes SLO gate in 3 consecutive runs.
2. Injected regression flagged in fixture.

## Assumptions & open decisions
- ASSUMPTION: targets above.
- D02 (cycle optimizer latency): PROVISIONAL (D02 default, unapproved).
