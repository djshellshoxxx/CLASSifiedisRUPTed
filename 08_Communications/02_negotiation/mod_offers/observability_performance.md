# PS-063-08 — observability performance
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/02_negotiation/mod_offers. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R09), CTR-ERR-001 (R10), CTR-EVT-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-063-08.R01 | `ofr.create`, `ofr.counter`, `ofr.accept` p95 ≤ 300 ms (ASSUMPTION). | MVP |
| PS-063-08.R02 | `ofr.list` p95 ≤ 150 ms for 50 items. | MVP |
| PS-063-08.R03 | Expiry job lag ≤ 60 s from `expires_at` to `offer.expired`. | MVP |
| PS-063-08.R04 | Logs never contain amounts, currency codes or terms digests. | MVP |
| PS-063-08.R05 | Money validation p95 ≤ 5 ms. | MVP |

## Data / schema
Metrics: `offers_command_total{cmd,outcome}`, `offers_command_latency_ms{cmd}`, `offers_expiry_lag_seconds`, `offers_validation_reject_total{code}`, `offers_queue_rejected_total{reason}`.

## Commands / queries / events
Event lag p95 ≤ 2 s.

## States & transitions
Dashboards from [PS-063-03](workflow_state_machine.md) transitions.

## Validation & errors
Codes only.

## Authorization
Denial counters per [PS-063-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Alert on any accept committed after expiry.

## Privacy, retention, abuse
Metrics unlabelled by party or amount. Retention RET-OPS 30 days.

## Observability & budgets
| Budget | Target |
|---|---|
| offer command p95 | ≤ 300 ms |
| list p95 | ≤ 150 ms |
| expiry lag | ≤ 60 s |
| accept after expiry | 0 |

## Tests
- TEST-PS-063-08-01 (performance): load test; budgets met.
- TEST-PS-063-08-02 (logs): fixture amount and digest absent from logs.
- TEST-PS-063-08-03 (expiry): job lag measured ≤ 60 s under load.

## Acceptance criteria
1. Budgets met (TEST-PS-063-08-01, -03).
2. Log redaction passes (TEST-PS-063-08-02).

## Assumptions & open decisions
- ASSUMPTION: budgets are targets.
- D03 (mixed currency valuation): PROVISIONAL (D03 default, unapproved).
