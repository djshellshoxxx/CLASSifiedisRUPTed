# PS-029-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/01_service_catalog/mod_skills. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-029-08.R01 | Emit metrics `skills_attach_total{result}`, `skills_detach_total{reason}`, `skills_pending_rows` (gauge), `skills_search_latency_ms` (histogram). | MVP |
| PS-029-08.R02 | Attach p95 ≤ 300 ms server-side at 2,000 active listings per code (ASSUMPTION). | MVP |
| PS-029-08.R03 | Search p95 ≤ 250 ms for queries of ≤ 5 codes returning ≤ 50 rows (ASSUMPTION). | MVP |
| PS-029-08.R04 | Logs use pseudonymous IDs only and error codes; no label text, no proficiency values (CTR-PRV-001 R09). | MVP |
| PS-029-08.R05 | Traces carry `request_id` and command name; no request body capture. | MVP |
| PS-029-08.R06 | Alert when `skills_pending_rows` grows > 500 per day or when the 30-day expiry job lags > 24 h. | MVP |
| PS-029-08.R07 | Dashboards show counts by status and code family, never individual listings. | MVP |

## Data / schema
Metric labels are closed enums: `result` ∈ {ok, limit, taxonomy_unknown, duplicate, conflict, forbidden, error}. No free-text labels.

## Commands / queries / events
Each command emits one latency sample and one result counter. Event emission failure increments `skills_event_append_failed_total` and alerts.

## States & transitions
Gauge recomputed on each transition in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Validation error counters use CTR-ERR-001 codes only.

## Authorization
Dashboards require operator read scope `global` with purpose (CTR-CAP-001 R06). Per-listing drill-down is not provided.

## Failure, idempotency, concurrency, offline
Metrics are best-effort; loss does not block writes. Offline client metrics are batched and sent only after relay acknowledgment (D08 PROVISIONAL).

## Privacy, retention, abuse
Telemetry retention 30 days (ASSUMPTION). Aggregates below 5 events are suppressed in dashboards to avoid singling out a listing (CTR-PRV-001 R04 analogue).

## Observability & budgets
| Budget | Target |
|---|---|
| Attach p95 | ≤ 300 ms |
| Search p95 | ≤ 250 ms |
| Expiry job | ≤ 5 min per 10,000 rows |
| Telemetry overhead | ≤ 2% CPU (ASSUMPTION) |

## Tests
- TEST-PS-029-08-01 unit: each metric increments with correct labels.
- TEST-PS-029-08-02 log-scan: no label text in captured logs during integration run.
- TEST-PS-029-08-03 load: search p95 target at 2,000 listings per code.

## Acceptance criteria
1. All four metric families exist and use closed label enums.
2. Log-scan test passes with zero label or proficiency leaks.
3. Alert rules R06 are configured before release (future gate).

## Assumptions & open decisions
- ASSUMPTION: latency budgets as listed.
- ASSUMPTION: aggregate suppression threshold of 5.
- No payment or receipt checklist applies.
