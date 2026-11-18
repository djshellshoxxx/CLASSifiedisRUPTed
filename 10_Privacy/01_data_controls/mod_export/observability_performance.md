# PS-078-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_export (Privacy Lead, F10; platform metrics via F15). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (zero-tolerance alerts, R09 redaction tests), CTR-ERR-001 (R10).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-078-08.R01 | Metrics: `export_requests_total{scope}`, `export_state_total{state}`, `export_generation_seconds` (histogram), `export_package_bytes` (histogram), `export_download_total{outcome}`. | MVP |
| PS-078-08.R02 | Labels are enums only; no subject or package identifier as label. | MVP |
| PS-078-08.R03 | Logs record `dsr_` ID, state, bytes and error code; never manifest paths, file names or content. | MVP |
| PS-078-08.R04 | Alert when any `LOCATION_PRECISE` or `SECRET` fixture value appears in logs or metrics. | MVP |
| PS-078-08.R05 | Alert when generation p95 exceeds 15 min over 1 h. | MVP |

## Data / schema
Metric label allowlist in config; unknown labels dropped and counted.

## Commands / queries / events
None.

## States & transitions
Not applicable.

## Validation & errors
Label validation at emit.

## Authorization
Dashboards readable by Privacy Lead and on-call; no per-subject views.

## Failure, idempotency, concurrency, offline
Metric emit failure does not block generation.

## Privacy, retention, abuse
Logs RET-OPS. Metrics aggregated.

## Observability & budgets
Request p95 ≤ 250 ms; download first byte p95 ≤ 500 ms; generation p95 ≤ 15 min for accounts ≤ 1 GB (ASSUMPTION).

## Tests
- TEST-PS-078-08-01 (unit): label allowlist rejects `dsr_` as label.
- TEST-PS-078-08-02 (log scan): generation run emits no fixture coordinates or file names.

## Acceptance criteria
1. Metrics in R01 present in staging.
2. Log scan (TEST-PS-078-08-02) returns zero matches.
3. Performance budgets measured on seeded 1 GB fixture.

## Assumptions & open decisions
- ASSUMPTION: budgets above.
- PROVISIONAL (D07 default): log retention RET-OPS.
