# PS-001-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_archive. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10 server logs), CTR-PRV-001 (R09 telemetry, pseudonymous IDs), CTR-EVT-001 (`correlation_id`), CTR-ID-001 (`req_`). All p95 targets are ASSUMPTION until load-tested.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-001-08.R01 | Counter `archive_commands_total{command,outcome}`; outcome = `ok`, error code, or `replay`. | MVP |
| PS-001-08.R02 | Histogram of server latency per command and per query. | MVP |
| PS-001-08.R03 | Gauge `archive_deindex_lag_seconds` (commit to index removal). Alert when p95 > 60 s for 10 min. | MVP |
| PS-001-08.R04 | Client gauge `archive_pending_queue_depth`, aggregated; no per-user value. | MVP |
| PS-001-08.R05 | Logs carry `code`, `request_id`, `correlation_id`, `listing_id`, outcome. Never bodies, case context or account IDs for moderator entries (CTR-ERR-001 R10). | MVP |
| PS-001-08.R06 | No telemetry field carries coordinates, location finer than LOCATION_COARSE, or free text. | MVP |

## Data / schema
Telemetry fields are a subset of pseudonymous IDs and enums from [domain_schema.md](domain_schema.md). No new persisted data.

## Commands / queries / events
Each command and query named in [commands_queries_events.md](commands_queries_events.md) has a latency histogram.

## States & transitions
De-index lag is measured from the transition commit in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Error-code counts drive the alert on error rate below.

## Authorization
Dashboards are restricted to operators with aggregate-only scope; no per-account views (CTR-CAP-001 R04).

## Failure, idempotency, concurrency, offline
Replay outcomes are counted separately so duplicate delivery is visible without alarm.

## Observability & budgets
| Operation | p95 server latency | Throughput (ASSUMPTION) |
|---|---|---|
| `archive_listing` | ≤ 250 ms | 50 req/s per region |
| `restore_listing` (includes publish revalidation) | ≤ 400 ms | 20 req/s per region |
| `list_archived_listings` (page 50) | ≤ 300 ms | 100 req/s per region |
| `get_archive_state` | ≤ 150 ms | 300 req/s per region |
| Commit to de-index | ≤ 60 s | n/a |
| Offline queue flush after reconnect (50 entries) | ≤ 30 s | n/a |

Alerts:

| Signal | Threshold | Action |
|---|---|---|
| `ARCHIVE.*` error rate | > 2 % over 15 min | platform on-call (F15) |
| `EVT.REVISION_CONFLICT` rate | > 5 % of archive commands over 15 min | investigate client bug |
| Moderator archives | > 3× 7-day median in 1 h | Trust & Safety review (F12) |
| De-index lag | p95 > 60 s for 10 min | reindex runbook |

## Privacy, retention, abuse
Telemetry is pseudonymous (CTR-PRV-001 R09). Aggregates have no per-listing or per-account drill-down.

## Tests
- TEST-PS-001-08-01 — unit: metric labels contain only enum values.
- TEST-PS-001-08-02 — log scan: no free text, coordinates or case IDs in logs during the integration suite.
- TEST-PS-001-08-03 — load: budgets in the table at 2× expected peak.

## Acceptance criteria
1. Budgets met in the load test fixture; results attached to the review, not claimed here.
2. Log scan finds zero forbidden fields.
3. Alerts fire in a staged drill.

## Assumptions & open decisions
- PROVISIONAL (D08 default, unapproved): queue metrics needed for the offline model.
- PROVISIONAL (D05 default, unapproved): no location precision in telemetry.
- ASSUMPTION: all latency and throughput numbers above.
