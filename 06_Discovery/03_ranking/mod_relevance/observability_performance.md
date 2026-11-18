# PS-047-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/03_ranking/mod_relevance. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (metric rules), CTR-ERR-001.

**Decision labels:** Budgets ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-047-08.R01 | `search_rank_latency_ms` p95 ≤ 50 ms (1000 candidates). | MVP |
| PS-047-08.R02 | Reason-code distribution counted per model version. | MVP |
| PS-047-08.R03 | Shadow-vs-active comparison metrics (rank correlation, top-10 overlap) recorded per day. | MVP |
| PS-047-08.R04 | No labels with listing IDs, user IDs or scores per person. | MVP |

## Data / schema
Metrics: `search_rank_latency_ms`, `search_rank_reason_total{code,model_version}`, `ranking_shadow_overlap_top10`, `search_rank_fallback_total`, `search_rank_partial_total`.

## Commands / queries / events
Not applicable.

## States & transitions
Counters per PS-047-03 transition.

## Validation & errors
`relevance_validation_reject_total{code}`.

## Authorization
Aggregated metrics only.

## Failure, idempotency, concurrency, offline
Fallback and partial rates alerted.

## Privacy, retention, abuse
Metrics RET-OPS (30 days).

## Observability & budgets
Alerts: p95 > 50 ms for 10 min; fallback share > 1% for 1 h (ASSUMPTION); shadow top-10 overlap below 0.5 before activation review (ASSUMPTION).

## Tests
- TEST-PS-047-08-01 (lint): forbidden label keys absent.
- TEST-PS-047-08-02 (load): 1000 candidates p95 ≤ 50 ms.
- TEST-PS-047-08-03 (alert): seeded fallback share fires alert.
- TEST-PS-047-08-04 (unit): shadow metrics computed on fixture pair.

## Acceptance criteria
1. Metrics present with specified labels.
2. Load budget met.
3. Alerts fire within 5 minutes.

## Assumptions & open decisions
- ASSUMPTION: thresholds above.
