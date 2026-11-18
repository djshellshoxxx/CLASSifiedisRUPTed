# PS-124-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/04_configuration/mod_flags (F15.S04.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-124-08.R01 | Metrics: `flag_evaluations_total{source}`, `flag_evaluation_latency_ms`, `flag_kill_total`, `flag_rules_age_seconds`. | MVP |
| PS-124-08.R02 | Evaluation p95 <= 5 ms server-side (ASSUMPTION). | MVP |
| PS-124-08.R03 | Alert on any kill; alert on `default` source > 1% for 10 min. | MVP |
| PS-124-08.R04 | Dashboard shows rollout percentages and counts; no subject-level view. | MVP |

## Data / schema
Labels: `source`, `key` (catalog keys), `capability`.

## Commands / queries / events
None.

## States & transitions
Not applicable.

## Validation & errors
Not applicable.

## Authorization
Dashboard per PS-124-05 R05.

## Failure, idempotency, concurrency, offline
Not applicable.

## Privacy, retention, abuse
No subject identifiers in metrics.

## Observability & budgets
Budgets in R02.

## Tests
- TEST-PS-124-08-01 (unit): alert thresholds.
- TEST-PS-124-08-02 (performance): 10,000 evaluations per second meets R02.
- TEST-PS-124-08-03 (log scan): no subject identifiers in metrics or logs.
- TEST-PS-124-08-04 (dashboard): no subject-level endpoint.

## Acceptance criteria
1. Latency budget met (TEST-02).
2. TEST-PS-124-08-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 10,000 evaluations per second per node reference load.
