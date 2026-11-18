# PS-044-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_filter. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (metric and log rules), CTR-ERR-001.

**Decision labels:** Budgets ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-044-08.R01 | `filter_evaluate_latency_ms` p95 ≤ 150 ms (ASSUMPTION). | MVP |
| PS-044-08.R02 | Validation latency p95 ≤ 5 ms. | MVP |
| PS-044-08.R03 | Partial-result rate reported per shard. | MVP |
| PS-044-08.R04 | No labels with keyword text or cell IDs per person. | MVP |

## Data / schema
Metrics: `filter_evaluate_latency_ms`, `filter_evaluate_total{outcome}`, `filter_validation_reject_total{code}`, `filter_partial_results_total`, `saved_search_digest_sent_total`.

## Commands / queries / events
Not applicable beyond counters.

## States & transitions
Not applicable.

## Validation & errors
Validation counter per code.

## Authorization
Aggregated metrics only.

## Failure, idempotency, concurrency, offline
Digest lag alert.

## Privacy, retention, abuse
Metrics RET-OPS (30 days).

## Observability & budgets
Alerts: p95 evaluate > 150 ms for 10 min; partial-result rate > 1% for 15 min; digest lag > 2 h (ASSUMPTION).

## Tests
- TEST-PS-044-08-01 (lint): forbidden label keys absent.
- TEST-PS-044-08-02 (load): 500 evaluations per second fixture meets p95 ≤ 150 ms.
- TEST-PS-044-08-03 (alert): seeded shard failure raises partial-result alert.
- TEST-PS-044-08-04 (unit): counters increment once per call.

## Acceptance criteria
1. Metrics present with specified labels.
2. Load budget met on fixture.
3. Alert fires within 5 minutes.

## Assumptions & open decisions
- ASSUMPTION: thresholds above.
