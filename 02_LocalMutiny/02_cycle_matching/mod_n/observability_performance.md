# PS-018-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_n. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001 (R10), CTR-PRV-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-018-08.R01 | Metrics: `cyclen_run_total{status}`, `cyclen_run_seconds{length}` histogram, `cyclen_steps_used` histogram, `cyclen_truncated_total`. | MVP |
| PS-018-08.R02 | Run p95 ≤ 2 s at length 8 with 5,000-edge snapshot on the reference profile (ASSUMPTION). | MVP |
| PS-018-08.R03 | Alert when budget-exhausted ratio > 10% over 15 min (ASSUMPTION). | MVP |
| PS-018-08.R04 | Logs carry run hash prefix, length, status and timing only. | MVP |

## Data / schema
Length label values 5–8 only.

## Commands / queries / events
One timing sample per run.

## States & transitions
Counts per terminal state.

## Validation & errors
Counters by CYCLEN code.

## Authorization
Aggregate dashboards only.

## Failure, idempotency, concurrency, offline
Metric loss tolerated.

## Privacy, retention, abuse
Metrics 30 days; logs redact candidate refs.

## Observability & budgets
≤ 1 KB log per run; ≤ 20 series.

## Tests
- TEST-PS-018-08-01 (unit): one sample per run.
- TEST-PS-018-08-02 (load): length-8 p95 measured (not yet measured).
- TEST-PS-018-08-03 (negative): no candidate refs in logs.

## Acceptance criteria
1. Metric names match the list.
2. Latency targets are ASSUMPTION until benchmarked.
3. Zero candidate refs in logs.

## Assumptions & open decisions
- ASSUMPTION: 2 s p95 budget at length 8.
- PENDING: reference profile (F15).
