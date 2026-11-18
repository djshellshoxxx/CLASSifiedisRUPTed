# PS-081-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_model. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10), CTR-PRV-001 (R09), CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-081-08.R01 | Coverage metric: percent of cross-boundary flows with a registered control; target 100%. | MVP |
| PS-081-08.R02 | Drift metric: count of code-declared flows absent from the approved model; target 0. | MVP |
| PS-081-08.R03 | Model query p95 ≤ 100 ms (ASSUMPTION). | MVP |
| PS-081-08.R04 | Metrics labels exclude asset owner IDs. | MVP |

## Data / schema
Metric labels: `zone_pair`, `class`, `outcome`.

## Commands / queries / events
Consumes `flow.*` events.

## States & transitions
Not applicable.

## Validation & errors
Metric export failure never blocks approval.

## Authorization
Dashboards for Privacy and Security leads.

## Failure, idempotency, concurrency, offline
If metrics fail, CI still enforces R02 via the build check.

## Privacy, retention, abuse
Logs contain no content; retention 90 days (ASSUMPTION).

## Observability & budgets
| Metric | Target |
|---|---|
| model_flow_coverage_ratio | 1.0 |
| model_drift_total | 0 |
| model_query_latency_ms p95 | ≤ 100 |

## Tests
- TEST-PS-081-08-01 (coverage): seeded uncovered boundary lowers coverage metric.
- TEST-PS-081-08-02 (drift): new flow in code without model entry fails check.
- TEST-PS-081-08-03 (redaction): metrics contain no owner IDs.

## Acceptance criteria
1. Coverage metric equals 1.0 on approved fixtures.
2. Drift check blocks merge on seeded drift.
3. Redaction test passes.

## Assumptions & open decisions
- ASSUMPTION: latency and log retention targets.
