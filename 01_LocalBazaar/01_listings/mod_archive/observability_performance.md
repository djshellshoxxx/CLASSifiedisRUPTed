# PS-001-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_archive. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10 server logs), CTR-PRV-001 (R09 telemetry, pseudonymous IDs only), CTR-EVT-001 (`correlation_id`), CTR-ID-001 (`req_`). **Decisions:** D08 (queue metrics), D05 (no location in telemetry) (defaults PROVISIONAL, unapproved). All p95 targets are ASSUMPTION until load-tested.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-001-08.R01 | Emit counters `archive_commands_total{command,outcome}` with outcome = ok, error code, or replay. | MVP |
| PS-001-08.R02 | Emit histograms for server latency per command and per query. | MVP |
| PS-001-08.R03 | Emit gauge `archive_deindex_lag_seconds` (commit to index removal). Alert when p95 > 60 s for 10 min. | MVP |
| PS-001-08.R04 | Emit gauge `archive_pending_queue_depth` on clients (aggregated, no per-user value). | MVP |
| PS-001-08.R05 | Logs carry `code`, `request_id`, `correlation_id`, `listing_id`, outcome. Never bodies, reasons with case context, or account IDs in moderator entries (CTR-ERR-001 R10). | MVP |
| PS-001-08.R06 | No telemetry field carries coordinates, region precision beyond LOCATION_COARSE, or free text. | MVP |

## Budgets
| Operation | p95 server latency | Throughput budget (ASSUMPTION) |
|---|---|---|
| `archive_listing` | ≤ 250 ms | 50 req/s per region |
| `restore_listing` (includes publish revalidation) | ≤ 400 ms | 20 req/s per region |
| `list_archived_listings` (page 50) | ≤ 300 ms | 100 req/s per region |
| `get_archive_state` | ≤ 150 ms | 300 req/s per region |
| Commit to de-index | ≤ 60 s | n/a |
| Client offline queue flush after reconnect | ≤ 30 s for 50 entries | n/a |

## Alerts
| Signal | Threshold | Action |
|---|---|---|
| `ARCHIVE.*` error rate | > 2 % of requests over 15 min | page platform on-call (F15) |
| `EVT.REVISION_CONFLICT` rate | > 5 % of archive commands over 15 min | investigate concurrent client bug |
| Moderator archive count | > 3× 7-day median in one hour | Trust & Safety review (F12) |
| De-index lag | p95 > 60 s for 10 min | runbook: reindex queue |

Dashboards show counts, latency and lag only. Per-listing and per-account views are not available in telemetry.
