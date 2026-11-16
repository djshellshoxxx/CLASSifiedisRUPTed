# PS-089-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_blocklists. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R09 telemetry IDs only, R10 push text), CTR-CAP-001 (decision metrics), CTR-FED-001 (R12 jitter, R11 limits), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-089-08.R01 | `blocklist.check` latency p95 ≤ 2 ms and p99 ≤ 10 ms at 100,000 active entries, measured in-process (ASSUMPTION). | MVP |
| PS-089-08.R02 | Committed activation enforced within 5 s (p95); expiry enforced within 60 s of `expires_at`. | MVP |
| PS-089-08.R03 | Federated activation to outbound send: p95 ≤ 5 min (ASSUMPTION; includes CTR-FED-001 R12 jitter of 0–60 s). | MVP |
| PS-089-08.R04 | Logs carry `blk_` IDs, enum codes and `target_kind` only. Digests are logged as first 8 hex characters; `target_ref` values are never logged (CTR-PRV-001 R09). | MVP |
| PS-089-08.R05 | Metric labels exclude `target_ref`, `actor` and any personal field (cardinality and privacy). | MVP |

## Data / schema
| Metric | Type | Labels | Budget / alert |
|---|---|---|---|
| `blocklist_check_latency_ms` | histogram | `outcome` | p95 ≤ 2 ms |
| `blocklist_entries_active` | gauge | `target_kind`, `scope` | none |
| `blocklist_transitions_total` | counter | `from`, `to` | see PS-089-03 |
| `blocklist_inbound_denied_total` | counter | `target_kind` | alert > 5× 7-day baseline |
| `blocklist_export_lag_seconds` | histogram | none | p95 ≤ 300 s |
| `blocklist_validation_rejections_total` | counter | `code` | PS-089-02 |
| `blocklist_import_pending` | gauge | none | alert > 1,000 |

## Commands / queries / events
None. Metrics are emitted from the paths specified in PS-089-03, -04 and -06.

## States & transitions
None.

## Validation & errors
Validation metrics per PS-089-02.

## Authorization
Metrics are operational and carry no content. Dashboards readable by `ope_` with global scope only.

## Failure, idempotency, concurrency, offline
Metrics emission must not block commits; emission failure is dropped and counted in `blocklist_metric_drop_total` (ASSUMPTION).

## Privacy, retention, abuse
Logs and metrics follow RET-OPS (30 days). Redaction tests run on application logs and exports (CTR-PRV-001 BT-08).

## Observability & budgets
Alerts: check unavailable > 0 for 60 s; deferred inbound > 1,000 in 5 min; export failure > 24 h; inbound denial rate > 5× baseline. Budgets above are ASSUMPTION until load test in 17_Quality/02_performance/mod_load.

## Tests
- TEST-PS-089-08-01 (load): 100,000 entries; check p95 ≤ 2 ms and p99 ≤ 10 ms.
- TEST-PS-089-08-02 (integration): activation enforced within 5 s; expiry within 60 s.
- TEST-PS-089-08-03 (unit): log redaction scan finds no full digest, `target_ref` or coordinate.
- TEST-PS-089-08-04 (unit): metric label set contains no `target_ref`, `actor` or personal field.
- TEST-PS-089-08-05 (integration): injected 1,001 deferred events fires alert.

## Acceptance criteria
1. Latency budgets met at 100,000 entries; TEST-PS-089-08-01 passes.
2. Logs and metrics pass redaction; TEST-PS-089-08-03 and -04 pass.
3. Alerts fire on injected faults; TEST-PS-089-08-05 passes.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md). Labels below are PROVISIONAL (default, unapproved) where marked.
- ASSUMPTION: all numeric budgets in this file until load test.
- Related: D07 (retention, PROVISIONAL) for log and metric retention.
