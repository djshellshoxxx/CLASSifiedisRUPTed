# PS-093-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_evidence (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-093-08.R01 | Metrics published for every capture outcome, scan outcome and content read. | MVP |
| PS-093-08.R02 | Logs carry `evidence_id`, `report_id`, codes and timings only. Zero content, zero GPS. | MVP |
| PS-093-08.R03 | Alerts fire within 5 min of breach. | MVP |

## Metrics
| Metric | Type | Labels |
|---|---|---|
| evidence_captures_total | counter | outcome (captured, rejected, expired) |
| evidence_validation_rejections_total | counter | code |
| evidence_scan_latency_ms | histogram | verdict |
| evidence_gps_stripped_total | counter | none (count only) |
| evidence_reads_total | counter | purpose, outcome |
| evidence_staging_orphans | gauge | none |

## Budgets
| Operation | p95 target | Basis |
|---|---|---|
| Capture (5 MiB, excl. upload) | ≤ 2.5 s | ASSUMPTION |
| Scan (5 MiB) | ≤ 2 s | ASSUMPTION |
| evidence.get | ≤ 150 ms | ASSUMPTION |
| Redaction propagation | ≤ 24 h | CTR-PRV-001 R06 |

## Alerts
- Scanner unavailable > 5 min.
- Any GPS tag detected after strip step (must be 0).
- Staging orphans > 0 after TTL + 5 min.
- Content read outside an active case (CTR-CAP-001 alerts).
- Redaction propagation lag > 24 h.

## Log redaction
Redaction tests run over application logs, reverse-proxy logs and crash reports (CTR-PRV-001 BT-08). Image bytes and filenames are never logged.

## Privacy, retention, abuse
Metrics use counts and coarse labels only; no per-reporter labels. Dashboards are case-agnostic.

## Failure, idempotency, concurrency, offline
Telemetry emission failure never blocks capture. Client-side offline counters are sent on reconnect with dedupe by counter epoch.

## Authorization
Dashboards readable by `ope` role with `global` scope; no content access.

## Tests
- TEST-PS-093-08-01 (log capture): synthetic capture produces logs with IDs and codes only.
- TEST-PS-093-08-02 (alert): forced scanner outage fires alert within 5 min.
- TEST-PS-093-08-03 (budget): load test at 50 concurrent 5 MiB captures meets p95 targets.

## Acceptance criteria
1. All metrics in the table exist with stated labels.
2. Log capture contains no GPS, no image bytes, no message text.

## Assumptions & open decisions
- ASSUMPTION: budgets above; validated in F15 load test.
- PROVISIONAL (D07 default, unapproved): log retention RET-OPS 30 days.
