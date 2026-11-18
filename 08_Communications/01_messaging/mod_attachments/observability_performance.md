# PS-059-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_attachments. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (diagnostics), CTR-EVT-001 (lag), CTR-PRV-001 (log classes), CTR-CAP-001 R08.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-059-08.R01 | Each upload step, scan and purge emits counter and latency. | MVP |
| PS-059-08.R02 | Chunk write p95 ≤ 500 ms for 1 MiB; scan queue lag p95 ≤ 30 s; access grant p95 ≤ 100 ms. | MVP |
| PS-059-08.R03 | Logs carry `att_id`, state and code only; never file names, bytes or metadata. | MVP |
| PS-059-08.R04 | Metric labels exclude `att_id`, `msg_id`, file names and sizes per user. | MVP |
| PS-059-08.R05 | Alerts: scanner failure rate > 2% over 15 min; purge backlog past deadline; repeated `SCAN_FAILED` from one account. | MVP |
| PS-059-08.R06 | Upload control and progress announced to assistive tech (WCAG 2.1 AA). | MVP |

## Data / schema
| Metric | Type | Labels |
|---|---|---|
| `attach_cmd_total` | counter | `command`, `result` |
| `attach_validation_fail_total` | counter | `code` |
| `attach_scan_lag_seconds` | histogram | none |
| `attach_purge_backlog` | gauge | none |
| `attach_authz_deny_total` | counter | `action` |

## Commands / queries / events
Covers PS-059-04 paths.

## States & transitions
`attach_transition_total{from,to}`.

## Validation & errors
Counters by code only.

## Authorization
Dashboards for F08 and F16; no per-thread views.

## Failure, idempotency, concurrency, offline
Device queue depth in aggregate only.

## Privacy, retention, abuse
Operational logs 30 days (RET-OPS); metrics 13 months aggregated; audit 12 months.

## Observability & budgets
- Availability 99.9% monthly (ASSUMPTION).
- Load: 20 uploads/s peak; 500 access grants/s (ASSUMPTION).
- Storage growth alert at 80% of quota.

## Tests
- TEST-PS-059-08-01 (unit): counters once per step.
- TEST-PS-059-08-02 (privacy scan): no file names or metadata in logs or metrics.
- TEST-PS-059-08-03 (load): 20 uploads/s within budget.
- TEST-PS-059-08-04 (a11y): upload progress announced.

## Acceptance criteria
1. Dashboards and alerts exist.
2. Redaction verified.
3. Budgets met.
4. No per-file labels.

## Assumptions & open decisions
- ASSUMPTION: targets above.
- PROVISIONAL (D07 default, unapproved): log retention 30 days.
