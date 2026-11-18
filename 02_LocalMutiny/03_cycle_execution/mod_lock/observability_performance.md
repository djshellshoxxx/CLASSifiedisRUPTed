# PS-023-08 — Observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_lock. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-023-08.R01 | Acquisition p95 ≤ 200 ms and p99 ≤ 500 ms for sets of ≤ 8 items at 100 acquisitions/s. | MVP |
| PS-023-08.R02 | Expiry lag p95 ≤ 5 s after `expires_at`. | MVP |
| PS-023-08.R03 | Metric labels: `outcome`, `set_size_bucket`, `state`. No item or cycle IDs. | MVP |

## Data / schema
Metrics: `lock_acquire_seconds`, `lock_acquire_total{outcome}`, `lock_state{state}`, `lock_orphan_swept_total`.

## Commands / queries / events
Spans per acquisition with `set_size` attribute.

## States & transitions
Gauge from [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Counter per code.

## Authorization
Operator dashboards via `aud_`-logged access.

## Failure, idempotency, concurrency, offline
Orphan sweep and contention counters (see failure spec).

## Privacy, retention, abuse
Metrics retained 30 days (ASSUMPTION).

## Observability & budgets
Alerts: acquisition p99 > 500 ms for 5 min; contention > 20 % of acquisitions for 15 min (possible abuse); orphan sweep > 0 for 10 min.

## Tests
- TEST-PS-023-08-01 (load): 100 acquisitions/s for 10 min meets R01.
- TEST-PS-023-08-02 (observability): label set exactly as R03.
- TEST-PS-023-08-03 (alert): induced contention triggers alert.

## Acceptance criteria
1. Budgets met in load test.
2. No forbidden labels.
3. Alerts verified.

## Assumptions & open decisions
- ASSUMPTION: 100 acquisitions/s load target.
- [DECISIONS.md](../../../DECISIONS.md) D07 — PROVISIONAL (D07 default, unapproved): 30-day metric retention.
