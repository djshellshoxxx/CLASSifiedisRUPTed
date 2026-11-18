# PS-013-08 — observability and performance
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_offer. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-013-08.R01 | Emit counters for submit, validation failure per code, expiry, lock, conflict. Labels never include `acc_`, `ofr_` or note text. | MVP |
| PS-013-08.R02 | Submit p95 ≤ 300 ms; read p95 ≤ 150 ms at 1,000 open offers per cycle index (ASSUMPTION). | MVP |
| PS-013-08.R03 | Traces carry `cor_` IDs; span attributes are IDs and counts only. | MVP |
| PS-013-08.R04 | Dashboards show module health only; no per-user views. | MVP |

## Data / schema
Metric names: `offer_submit_total{result}`, `offer_validation_failure_total{code}`, `offer_revision_conflict_total`, `offer_expired_total`, `offer_lock_total`, `offer_submit_latency_seconds` (histogram).

## Commands / queries / events
Event lag metric: time from `recorded_at` to consumer ack, p95 ≤ 5 s.

## States & transitions
Gauge of offers per state, sampled every 60 s, aggregated by cycle size only.

## Validation & errors
Validation failure metrics use codes from PS-013-02; no input values.

## Authorization
Telemetry access follows F16 operator grants; no content access.

## Failure, idempotency, concurrency, offline
Metric emission is best-effort and must not block commits. Client offline queue depth reported in aggregate, once per day (PS-013-06).

## Privacy, retention, abuse
Logs carry pseudonymous IDs only (CTR-PRV-001 R09). Metric retention 30 days (ASSUMPTION).

## Observability & budgets
Alert: lock conflict rate > 2% for 15 min. Alert: submit p95 > 300 ms for 10 min. Log redaction test runs in CI.

## Tests
- TEST-PS-013-08-01 (unit): metric label set excludes forbidden keys.
- TEST-PS-013-08-02 (performance): 1,000 open offers, 50 concurrent readers, p95 within budget.
- TEST-PS-013-08-03 (integration): alert fires on injected conflict spike.

## Acceptance criteria
1. Zero forbidden fields in log and trace fixtures.
2. Budgets in R02 met in load test at the stated scale.

## Assumptions & open decisions
- ASSUMPTION: 1,000 open offers per cycle index is the MVP sizing target.
- D07 PROVISIONAL (Dxx default, unapproved): metric retention 30 days.
