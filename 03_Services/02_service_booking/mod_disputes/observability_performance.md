# PS-030-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_disputes. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-030-08.R01 | Metrics: `service_dispute_open_total{reason_code,result}`, `service_dispute_links{link_state}` (gauge), `service_dispute_reconcile_total{outcome}`, `service_dispute_window_remaining_seconds` histogram. | MVP |
| PS-030-08.R02 | `dispute.create` p95 ≤ 1 s end-to-end including F09 call (ASSUMPTION). | MVP |
| PS-030-08.R03 | Reconciliation job: each `requested` link examined within 5 min of its `next_check_at`. | MVP |
| PS-030-08.R04 | Logs: request ID, link ID hash, enum codes, latency. No note, amount or party identifiers in clear. | MVP |
| PS-030-08.R05 | Alerts: any `DISPUTE.UNRESOLVED`; any link `requested` > 60 s; claim `DISPUTED` transition rate > 3× 7-day mean (ASSUMPTION). | MVP |
| PS-030-08.R06 | Dashboards aggregate by reason_code and state; suppress cells with < 5 events (CTR-PRV-001 R04 analogue). | MVP |
| PS-030-08.R07 | Traces never contain evidence digests. | MVP |

## Data / schema
Metric labels are closed enums: `reason_code`, `link_state`, `result`, `outcome`. No free text.

## Commands / queries / events
Each command emits one latency sample and result counter. Event append failure increments `service_dispute_event_append_failed_total` and alerts.

## States & transitions
Gauge recomputed on each local transition ([workflow_state_machine.md](workflow_state_machine.md)).

## Validation & errors
Counters keyed by CTR-ERR-001 codes only.

## Authorization
Dashboards require `global` operator read with purpose (CTR-CAP-001 R06); no per-party drill-down.

## Failure, idempotency, concurrency, offline
Metrics are best-effort. Offline client-side timing is not sent (drafts are local).

## Privacy, retention, abuse
Telemetry retention 30 days (ASSUMPTION). Dispute counts per party are not exported.

## Observability & budgets
| Budget | Target |
|---|---|
| Open p95 | ≤ 1 s |
| Reconcile lag | ≤ 5 min |
| Telemetry overhead | ≤ 2% CPU (ASSUMPTION) |

## Tests
- TEST-PS-030-08-01 unit: metric label sets are enum-closed.
- TEST-PS-030-08-02 log scan: no note or amount text in logs.
- TEST-PS-030-08-03 integration: alert fires on injected `DISPUTE.UNRESOLVED`.

## Acceptance criteria
1. All metrics use closed label sets.
2. Log scan passes with zero clear-text party identifiers.
3. Dashboard cells < 5 events are suppressed in test data.

## Assumptions & open decisions
- ASSUMPTION: latency and alert thresholds listed above.
- Payment checklist applies: amounts never appear in metric labels.
