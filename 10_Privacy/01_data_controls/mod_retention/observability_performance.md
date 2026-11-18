# PS-079-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_retention (Privacy Lead, F10; platform metrics via F15). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (metrics `prv_*`, zero-tolerance alerts), CTR-ERR-001 (R10), CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-079-08.R01 | Metrics: `retention_records_expired_total{class}`, `retention_records_purged_total{class}`, `retention_holds_active`, `retention_sweep_backlog_seconds`, `prv_class_violations_total` (CTR-PRV-001). | MVP |
| PS-079-08.R02 | Labels enum-only (class, store, outcome). | MVP |
| PS-079-08.R03 | Alert when `prv_class_violations_total` > 0 in production. | MVP |
| PS-079-08.R04 | Alert when any sweep backlog > 24 h. | MVP |
| PS-079-08.R05 | Logs: run IDs, class, counts; no record IDs or subject IDs. | MVP |

## Data / schema
Label allowlist: `retention_class` (10 values), `store_class`, `outcome`.

## Commands / queries / events
None.

## States & transitions
Not applicable.

## Validation & errors
Metric label validation.

## Authorization
Dashboards for Privacy Lead and on-call; hold counts visible to case scope only.

## Failure, idempotency, concurrency, offline
Metric failure does not block sweeps.

## Privacy, retention, abuse
Logs RET-OPS.

## Observability & budgets
Hold query p95 ≤ 250 ms; sweep throughput ≥ 5,000 records/min per class (ASSUMPTION).

## Tests
- TEST-PS-079-08-01 (unit): label allowlist.
- TEST-PS-079-08-02 (alert): injected class violation fires alert within 1 min.

## Acceptance criteria
1. Metrics present in staging.
2. Alert tests pass.
3. Log scan: zero record IDs in sweep logs.

## Assumptions & open decisions
- ASSUMPTION: throughput target.
- PROVISIONAL (D07 default).
