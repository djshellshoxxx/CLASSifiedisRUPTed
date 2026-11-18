# PS-120-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_backups (F15.S03.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-120-08.R01 | Metrics: `backup_last_success_age_seconds{scope}`, `backup_job_duration_seconds{scope,kind}`, `backup_verify_failures_total`, `backup_bytes_total{scope}`. | MVP |
| PS-120-08.R02 | Alert: last successful `events` backup older than 15 min (RPO target, ASSUMPTION). | MVP |
| PS-120-08.R03 | Alert: any `failed` set in 24 h; any verify failure (page immediately). | MVP |
| PS-120-08.R04 | Budgets: 100 GB full event-scope backup completes in <= 4 h at 200 MB/s effective write (ASSUMPTION); incremental window of 15 min completes in <= 5 min. | MVP |
| PS-120-08.R05 | Logs carry `bkp_id`, scope, counts, status and codes; never object names containing record IDs, never keys. | MVP |
| PS-120-08.R06 | Restore drill success is a published metric (`restore_drill_passed_total`), owned with PS-122. | MVP |

## Data / schema
Metric labels: `scope` and `kind` enums only.

## Commands / queries / events
Dashboard reads only aggregates.

## States & transitions
Not applicable.

## Validation & errors
Telemetry write failure does not fail the job; it increments `backup_telemetry_dropped_total`.

## Authorization
Dashboards require `ope` with platform operations role (PS-120-05 R03).

## Failure, idempotency, concurrency, offline
Not applicable to clients.

## Privacy, retention, abuse
Telemetry retention RET-OPS (30 days) for logs; aggregated metrics without identifiers kept 400 days (ASSUMPTION).

## Observability & budgets
Budgets in R04. Metrics ingestion < 1% overhead on job duration.

## Tests
- TEST-PS-120-08-01 (unit): alert rules fire at thresholds in R02, R03.
- TEST-PS-120-08-02 (performance): reference 100 GB full backup against R04 budget in staging.
- TEST-PS-120-08-03 (log scan): backup logs contain no keys or record IDs beyond `bkp_id`.
- TEST-PS-120-08-04 (chaos): stop backups for 20 min; alert fires within 2 min.

## Acceptance criteria
1. Alert for stale RPO fires in TEST-04 within 2 min.
2. TEST-PS-120-08-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: RPO 15 min; throughput budgets from staging hardware (OPEN).
- PROVISIONAL (D07 default).
