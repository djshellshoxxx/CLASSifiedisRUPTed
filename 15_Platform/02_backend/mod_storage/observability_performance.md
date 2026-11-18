# PS-119-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_storage. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10), CTR-PRV-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-119-08.R01 | Metrics: upload count and bytes by `owner_scope` and result; scan latency; orphan count; checksum mismatches. | MVP |
| PS-119-08.R02 | No labels containing `blob_id`, `owner_ref` or MIME of user-declared strings. | MVP |
| PS-119-08.R03 | Storage latency and error metrics per object store operation. | MVP |

## Data / schema
- `stored_upload_total{owner_scope,result}`
- `stored_upload_bytes_total{owner_scope}`
- `stored_scan_duration_seconds` (histogram)
- `stored_orphans_reclaimed_total`
- `stored_checksum_mismatch_total`
- `stored_store_op_duration_seconds{op}`

## Commands / queries / events
None.

## States & transitions
Not applicable.

## Validation & errors
Telemetry drop counter; never blocks writes.

## Authorization
Operator dashboards: `ope_` with `observability.read`; no byte access.

## Failure, idempotency, concurrency, offline
Metric push buffered; loss counted.

## Privacy, retention, abuse
Metrics 90 days; logs 14 days; traces 7 days (ASSUMPTION).

## Observability & budgets
| Measure | Target |
|---|---|
| upload accept (202) p95 | ≤ 1 s for 10 MiB (ASSUMPTION) |
| scan wait p95 | ≤ 60 s |
| download first byte (CDN) p95 | ≤ 300 ms |
| availability of read path | 99.9% monthly (ASSUMPTION) |

## Tests
- TEST-PS-119-08-01 (unit): label set contains no forbidden labels.
- TEST-PS-119-08-02 (load): 50 concurrent 5 MiB uploads meet accept p95.
- TEST-PS-119-08-03 (alert): checksum mismatch raises page within 5 min.

## Acceptance criteria
1. Dashboards for each metric exist before release.
2. Checksum mismatch alert verified in staging.
3. Load test results attached to release record.

## Assumptions & open decisions
- ASSUMPTION: budgets above.
- D07 PROVISIONAL (unapproved): telemetry retention.
