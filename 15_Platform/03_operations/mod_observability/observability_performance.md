# PS-121-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_observability (F15.S03.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-121-08.R01 | Health metrics for the pipeline: `telemetry_ingest_latency_ms` (p95 <= 100 ms per batch), `telemetry_dropped_total{reason}`, `telemetry_redaction_failures_total`. | MVP |
| PS-121-08.R02 | Alert: any redaction failure in production (page). | MVP |
| PS-121-08.R03 | Alert: any `CTR-ERR-001` code above 5% of responses for 5 min (BT-01). | MVP |
| PS-121-08.R04 | Dashboards show aggregates only; no per-user drill-down. | MVP |
| PS-121-08.R05 | Ingest availability target 99.9% monthly (ASSUMPTION). | MVP |
| PS-121-08.R06 | Pipeline overhead on emitters < 1% CPU at 1,000 records/s (ASSUMPTION). | MVP |

## Data / schema
Label enums only (module code, code, severity, reason).

## Commands / queries / events
None. Health alerts use PS-121-03 states.

## States & transitions
Not applicable.

## Validation & errors
Pipeline errors are reported with codes from CTR-ERR-001 (`SYS.UNAVAILABLE`, `OBSERV.*`).

## Authorization
Dashboard reads per PS-121-05 R02.

## Failure, idempotency, concurrency, offline
Pipeline degrades by dropping non-alert records first (PS-121-06).

## Privacy, retention, abuse
Health metrics carry no identifiers.

## Observability & budgets
Budgets in R01 and R06.

## Tests
- TEST-PS-121-08-01 (unit): alert rules for R02, R03 fire at thresholds.
- TEST-PS-121-08-02 (performance): 1,000 records/s load for 30 min meets R01 and R06.
- TEST-PS-121-08-03 (negative): dashboard API has no per-user endpoint.
- TEST-PS-121-08-04 (chaos): pipeline down; platform error budget unaffected (no blocking).

## Acceptance criteria
1. Performance budgets met in load test (TEST-02).
2. TEST-PS-121-08-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 99.9% ingest target.
- OPEN (F17): load profile for CI.
