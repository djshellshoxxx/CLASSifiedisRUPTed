# PS-022-08 — Observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_dropouts. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-022-08.R01 | Dropout detection-to-OPEN latency p95 ≤ 1 s after a deadline passes (timer lag). | MVP |
| PS-022-08.R02 | Resolution decision p95 ≤ 30 s from OPEN to RESOLVING. | MVP |
| PS-022-08.R03 | Metric labels: `reason_code`, `path`, `cycle_size` (2–8). No party or cycle IDs. | MVP |
| PS-022-08.R04 | Dashboards show dropout rate per 100 cycles by cycle size. | MVP |

## Data / schema
Metrics: `cycle_dropout_total{reason_code,cycle_size}`, `cycle_dropout_resolution_seconds{path}`, `cycle_dropout_open{state}` gauge.

## Commands / queries / events
Spans per command; attributes `dropout_id` only.

## States & transitions
Gauges per state from [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Count per CYC_DROPOUT.* code.

## Authorization
Dashboards readable by `ope_` only, with `aud_` logging.

## Failure, idempotency, concurrency, offline
Reconcile repairs counted (failure_recovery_idempotency.md).

## Privacy, retention, abuse
Metrics retained 30 days (ASSUMPTION). Rate of dropouts by cycle size is aggregate only; no per-user dashboards.

## Observability & budgets
Alerts: dropout rate above 15 % of cycles in 24 h (possible abuse or outage); timer lag p99 > 60 s; any case open > 7 days without escalation.

## Tests
- TEST-PS-022-08-01 (load): 1 000 cases per minute on timers meets R01.
- TEST-PS-022-08-02 (observability): forbidden labels absent.
- TEST-PS-022-08-03 (alert): synthetic 20 % dropout rate triggers alert.

## Acceptance criteria
1. Budgets met in load test.
2. No forbidden labels in exported metrics.
3. Alerts verified in staging.

## Assumptions & open decisions
- ASSUMPTION: load target 1 000 timer fires per minute.
- [DECISIONS.md](../../../DECISIONS.md) D07 — PROVISIONAL (D07 default, unapproved): 30-day metric retention.
