# PS-103-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_inapp. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10), CTR-PRV-001 (R09), CTR-EVT-001 (R04).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-103-08.R01 | Metrics carry no `acc_`, `ntf_` or parameter labels. | MVP |
| PS-103-08.R02 | Queue-to-delivery p95 ≤ 2 s; p99 ≤ 10 s. | MVP |
| PS-103-08.R03 | Sync p95 ≤ 300 ms; list p95 ≤ 200 ms; mark_read p95 ≤ 150 ms. | MVP |
| PS-103-08.R04 | Unread-count discrepancy between server and client sync is measured on sampled sessions (target 0 after sync). | MVP |

## Data / schema
| Metric | Type | Labels |
|---|---|---|
| `inapp_created_total` | counter | `template_key`, `outcome` (queued, suppressed, duplicate) |
| `inapp_transition_total` | counter | `from`, `to` |
| `inapp_queue_to_delivery_seconds` | histogram | none |
| `inapp_sync_latency_seconds` | histogram | none |
| `inapp_dead_letter_depth` | gauge | `producer` |

## Commands / queries / events
Spans `inapp.<command>` with `request_id`, code, duration, page size.

## States & transitions
Dashboards: queued depth, delivery lag, suppression ratio by template.

## Validation & errors
`inapp_validation_error_total{code, producer}`.

## Authorization
Dashboards: operations role, aggregate.

## Failure, idempotency, concurrency, offline
Alerts: queue-to-delivery p99 > 10 s for 5 min (page); dead-letter depth > 1 000 (page); suppression ratio jump > 3× baseline (ticket).

## Privacy, retention, abuse
Metrics exclude identifiers; suppression ratios are reported with K_MIN aggregation for small templates.

## Observability & budgets
Capacity: 5 000 notifications per second per node at launch (ASSUMPTION). Storage ≤ 1 KB per notification row.

## Tests
- `TEST-PS-103-08-01` load: 5 000 creates/s for 10 min meet R02.
- `TEST-PS-103-08-02` contract: no identifier labels.
- `TEST-PS-103-08-03` alert: forced dead-letter growth pages within 5 min.
- `TEST-PS-103-08-04` log scan: no parameter values in logs.

## Acceptance criteria
1. Metrics and alerts documented and tested.
2. Latency budgets met in staging.
3. Log scan finds zero parameter values.

## Assumptions & open decisions
- ASSUMPTION: capacity values are reference-node estimates.
- D07 (retention), PROVISIONAL default applies to metric retention (unapproved).
