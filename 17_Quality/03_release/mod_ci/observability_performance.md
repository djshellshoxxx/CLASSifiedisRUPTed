# PS-141-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_ci. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-141-08.R01 | Every pipeline run emits duration, queue-wait and per-stage timings. | MVP |
| PS-141-08.R02 | Logs and metrics use an allowlist of fields: run ID, job key, status, duration, runner pool. | MVP |
| PS-141-08.R03 | Flaky-rate and required-check failure rate are reported per branch per week. | MVP |

## Budgets
| Metric | Target (ASSUMPTION) |
|---|---|
| PR pipeline wall time, p95 | ≤ 20 min |
| Queue wait before dispatch, p95 | ≤ 2 min |
| Flake rate on required checks | ≤ 2% of runs per week |
| Run status visible after completion | ≤ 10 s, p95 |

## Metrics and alerts
- Alert: queue wait p95 above budget for one day notifies QA Lead.
- Alert: any secret-pattern rejection notifies Security Lead.
- Dashboards show counts and timings only; no log text.

## Assumptions & open decisions
- ASSUMPTION: budgets apply to the default PR pipeline on the trusted pool only.
- No Dxx governs these budgets directly: D07 applies to stored metrics retention: PROVISIONAL (D07 default, unapproved).
