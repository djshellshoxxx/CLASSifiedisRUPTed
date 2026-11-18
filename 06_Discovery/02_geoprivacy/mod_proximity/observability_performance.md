# PS-045-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_proximity. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (metrics rules, budget metrics), CTR-ERR-001.

**Decision labels:** Budgets ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-045-08.R01 | `proximity_query_latency_ms` p95 ≤ 100 ms (ASSUMPTION). | MVP |
| PS-045-08.R02 | Metrics expose cell state counts, not per-cell counts below K_MIN. | MVP |
| PS-045-08.R03 | Snapshot age gauge. | MVP |
| PS-045-08.R04 | No labels with user IDs or cell IDs for query metrics. | MVP |

## Data / schema
Metrics: `proximity_query_latency_ms`, `proximity_query_total{outcome}`, `proximity_cell_transitions_total{from,to}`, `proximity_snapshot_age_seconds`, `prv_location_query_budget_hits_total`, `proximity_refresh_failures_total`.

## Commands / queries / events
Not applicable.

## States & transitions
Counters per PS-045-03.

## Validation & errors
`proximity_validation_reject_total{code}`.

## Authorization
Aggregated only.

## Failure, idempotency, concurrency, offline
Snapshot age alert.

## Privacy, retention, abuse
Metrics RET-OPS (30 days); no per-user dimension.

## Observability & budgets
Alerts: any response with count < K_MIN (must be 0); snapshot age > 30 min; budget hits > 5% of region queries in 1 h (ASSUMPTION).

## Tests
- TEST-PS-045-08-01 (lint): no user or cell label on query metrics.
- TEST-PS-045-08-02 (load): ring-2 queries p95 ≤ 100 ms.
- TEST-PS-045-08-03 (alert): seeded sub-K_MIN response fires alert.
- TEST-PS-045-08-04 (alert): stale snapshot raises alert.

## Acceptance criteria
1. Metrics present with specified labels.
2. Latency budget met under fixture.
3. Alerts fire within 5 minutes.

## Assumptions & open decisions
- ASSUMPTION: thresholds above.
