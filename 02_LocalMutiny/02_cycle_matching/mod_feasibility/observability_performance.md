# PS-016-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_feasibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001 (R10), CTR-PRV-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-016-08.R01 | Metrics: `feasibility_verdict_total{verdict}`, `feasibility_eval_seconds` histogram, `feasibility_budget_exhausted_ratio`, `feasibility_upstream_error_total{upstream}`. | MVP |
| PS-016-08.R02 | p95 evaluation ≤ 500 ms for a 5,000-edge snapshot on the reference profile (ASSUMPTION; F15 to set profile). | MVP |
| PS-016-08.R03 | Alert when budget-exhausted ratio > 10% over 15 min (ASSUMPTION). | MVP |
| PS-016-08.R04 | Logs carry snapshot hash prefix, length, verdict and timing only. | MVP |

## Data / schema
Histogram buckets: 10 ms to 10 s. No label above 10 values.

## Commands / queries / events
Each evaluation emits one timing sample.

## States & transitions
Not applicable.

## Validation & errors
Error counters keyed by registry code.

## Authorization
Operator dashboards show aggregates only; no per-account view.

## Failure, idempotency, concurrency, offline
Metric loss tolerated; verdict events are not (PS-016-06).

## Privacy, retention, abuse
Metrics 30 days; logs redacted of IDs beyond hash prefix.

## Observability & budgets
≤ 1 KB log per evaluation; ≤ 30 metric series.

## Tests
- TEST-PS-016-08-01 (load): 5,000-edge snapshot p95 measured against the 500 ms target (not yet measured).
- TEST-PS-016-08-02 (unit): counter per verdict.
- TEST-PS-016-08-03 (negative): log scan finds no account IDs.

## Acceptance criteria
1. Metric names and labels match the list above.
2. Latency target stated as ASSUMPTION until measured.
3. Zero account identifiers in logs in fixture runs.

## Assumptions & open decisions
- PROVISIONAL (D02 default, unapproved): budget defines worst-case latency.
- PENDING: reference performance profile (F15).
