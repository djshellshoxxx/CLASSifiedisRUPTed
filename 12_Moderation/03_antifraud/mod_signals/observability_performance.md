# PS-101-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_signals (Trust&Safety Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R09 logs), CTR-ERR-001 (R10 server logs), CTR-EVT-001.

**Decision labels:** Throughput and latency budgets are ASSUMPTION, PROVISIONAL (D07 default, unapproved; F15 to validate).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-101-08.R01 | Emit counters `sig_recorded_total{signal_type}`, `sig_rejected_total{code}`, `sig_expired_total`, `sig_suppressed_total{reason_code}`. | MVP |
| PS-101-08.R02 | Emit gauges `sig_dlq_depth` and `sig_expiry_lag_seconds`. | MVP |
| PS-101-08.R03 | Logs carry `signal_id`, `signal_type`, `code` and timing only. `subject_ref` is logged only as a keyed digest. | MVP |
| PS-101-08.R04 | No per-subject dashboard exists. Dashboards show aggregates only. | MVP |
| PS-101-08.R05 | Traces carry `correlation_id` (CTR-EVT-001 R09), never payload values. | MVP |

## Data / schema
Metric labels are closed sets: `signal_type` (registry values), `code` (PS-101-02 table), `reason_code` (three values). Unknown labels are bucketed as `other`.

## Commands / queries / events
Each command and event increments one counter (PS-101-04).

## States & transitions
Expiry lag measured as `now − expires_at` for records in ACTIVE state.

## Validation & errors
Rejected-input rate is the primary validation health metric.

## Authorization
Dashboards are visible to `sys_` operators and Trust&Safety Lead only; no subject-level view.

## Failure, idempotency, concurrency, offline
Metric emission failure must not block ingest. Offline: not applicable.

## Privacy, retention, abuse
Metric and log retention 30 days (RET-OPS). Keyed digests use a rotated key (ASSUMPTION: 90-day rotation).

## Observability and budgets
| Budget | Target | Status |
|---|---|---|
| `sgn.create` server p95 | ≤ 150 ms | ASSUMPTION |
| `sgn.create` server p99 | ≤ 500 ms | ASSUMPTION |
| Sustained ingest per node | ≥ 1,000 signals/s | ASSUMPTION |
| Expiry lag | ≤ 1 hour | PS-101-03 R03 |
| `sgn_aggregate.read` p95 | ≤ 300 ms | ASSUMPTION |

Alerts: rejection rate > 2% over 15 minutes; suppression share > 10% of day's signals (possible mis-tuning); DLQ depth > 100 for 15 minutes.

## Tests
- TEST-PS-101-22 (integration): counters increment once per command, including duplicates' dedupe hit counter.
- TEST-PS-101-23 (negative): log scan of a 10,000-signal run finds no raw `subject_ref`, IP or coordinate.
- TEST-PS-101-24 (load): sustained 1,000 signals/s for 10 minutes meets p95 budget.

## Acceptance criteria
1. All metrics listed exist with labels from closed sets.
2. Log scan clean in CI.
3. Load test meets budgets or the budget is revised by F15 review.

## Assumptions & open decisions
- ASSUMPTION: metrics backend retains aggregates only.
- D07 (PROVISIONAL, unapproved). D08 offline: not applicable.
