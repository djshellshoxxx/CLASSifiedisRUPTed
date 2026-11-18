# PS-072-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_reconciliation (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-PRV-001 (R09), CTR-ERR-001 (R10). **Decisions:** D04 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-072-08.R01 | Metrics: `recon_runs_total{status}`, `recon_findings_open{type}`, `recon_coverage_ratio`, `recon_run_duration_seconds`. | MVP |
| PS-072-08.R02 | Alert: `FINAL_WITHOUT_ADAPTER` open > 0 for longer than 1 h. | MVP |
| PS-072-08.R03 | Alert: any run `partial` for more than 2 consecutive scheduled runs. | MVP |
| PS-072-08.R04 | Logs: run ID, status, counts, chain IDs, codes. No claim IDs in logs. | MVP |

## Data / schema
Closed label sets: status, finding type, chain.

## Commands / queries / events
Event counts by type.

## States & transitions
Gauge of runs by state.

## Validation & errors
Counter by code.

## Authorization
Dashboards show aggregates to operators only.

## Failure, idempotency, concurrency, offline
Coverage ratio is the alert input for silent failure.

## Privacy, retention, abuse
Metrics 90 days; logs 14 days (ASSUMPTION).

## Observability & budgets
Run duration p95 ≤ 30 min for 1,000,000 claims (ASSUMPTION); findings list p95 ≤ 500 ms.

## Tests
- TEST-PS-072-08-01 (contract): metric label lint.
- TEST-PS-072-08-02 (integration): synthetic FINAL without adapter raises alert in 1 h.
- TEST-PS-072-08-03 (integration): synthetic partial run raises alert on second run.
- TEST-PS-072-08-04 (unit): logs exclude claim IDs.

## Acceptance criteria
1. Alerts fire in staging.
2. Budgets measured in load test.
3. Logs redacted.

## Assumptions & open decisions
- ASSUMPTION: load profile.
- D04 (PROVISIONAL default, unapproved).
