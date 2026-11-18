# PS-116-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_offline (F15.S01.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-116-08.R01 | Client metrics: `offline_queue_depth{state}`, `offline_replay_latency_ms`, `offline_not_applied_total{code}`, `offline_exhausted_total`. | MVP |
| PS-116-08.R02 | Performance budgets: enqueue p95 <= 50 ms; list of 500 entries p95 <= 200 ms; app start with 500 entries <= 2.5 s p95 on the reference device (ASSUMPTION). | MVP |
| PS-116-08.R03 | Telemetry carries no `account_ref`, `local_id`, `payload` or `command_type` with identifiers; `command_type` is allowed as an enum label. | MVP |
| PS-116-08.R04 | Alert: `offline_not_applied_total` rate > 5% of replays in 1 h (ASSUMPTION). | MVP |
| PS-116-08.R05 | Local diagnostic export for support contains counts and codes only. | MVP |

## Data / schema
Metric labels are closed enums: `state` (six values), `code` (CTR-ERR-001 registry), `command_type` (module allow-list).

## Commands / queries / events
None. Metrics are emitted on transitions defined in PS-116-03.

## States & transitions
Not applicable.

## Validation & errors
Telemetry failure never blocks queue operations; dropped metrics increment `offline_telemetry_dropped_total`.

## Authorization
Telemetry is written by the client; it is not read by users. Dashboards are read by `ope` with aggregate scope only.

## Failure, idempotency, concurrency, offline
Metrics buffer locally up to 200 records and are sent when online; buffer overflow drops the oldest.

## Privacy, retention, abuse
Aggregates only (CTR-PRV-001 analytics row). Retention RET-OPS for operational counters.

## Observability & budgets
Budgets in R02. Telemetry payload per batch <= 16 KiB.

## Tests
- TEST-PS-116-08-01 (unit): label set matches enum; unknown label value rejected.
- TEST-PS-116-08-02 (performance): 500-entry list and enqueue budgets on reference device profile.
- TEST-PS-116-08-03 (negative): telemetry batches scanned for identifiers return zero matches.
- TEST-PS-116-08-04 (offline): buffer overflow drops oldest records and increments dropped counter.

## Acceptance criteria
1. All budgets in R02 measured in CI on the reference profile.
2. TEST-PS-116-08-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: reference device profile defined by F14 accessibility and F17 performance leads (OPEN).
- PROVISIONAL (D08 default).
