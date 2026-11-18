# PS-032-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_quotes. **Parent:** [mod_quotes SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001, CTR-EVT-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-032-08.R01 | Accept p95 ≤ 300 ms server side (PS-032-03). | MVP |
| PS-032-08.R02 | Outbox lag p95 ≤ 5 s (PS-032-06). | MVP |
| PS-032-08.R03 | Logs: `code`, `request_id`, module, timing only. No scope text, prices, line items or `acc_` IDs. | MVP |
| PS-032-08.R04 | Funnel dashboards by state transition counts; no per-provider price data. | MVP |

## Data / schema
Metric labels allowed: `from`, `to`, `code`, `action`. Forbidden: `acc_`, `svq_`, `srv_`, amounts, currency codes at per-quote granularity.

## Commands / queries / events
Spans with `request_id` and `correlation_id` (`cor_`).

## States & transitions
Transition metrics from PS-032-03.

## Validation & errors
`svcquote_validation_rejections_total{code}`.

## Authorization
Operator dashboards: counts only; no `ope` access to quote content.

## Failure, idempotency, concurrency, offline
Telemetry best-effort; never blocks accept. Client offline queue depth as aggregate count.

## Privacy, retention, abuse
Telemetry 30 days (ASSUMPTION). Allowlisted trace attributes. Scope-flag volume monitored for false-positive spikes.

## Observability & budgets
| Metric | Target |
|---|---|
| `svcquote_accept_latency_seconds` p95 | ≤ 0.3 s |
| `svcquote_outbox_lag_seconds` p95 | ≤ 5 s |
| `svcquote_partial_accept_total` | 0 |
| Accept success rate (excluding customer decline) | ≥ 99% (ASSUMPTION) |

## Tests
- TEST-PS-032-08-01 (unit): log formatter drops disallowed fields.
- TEST-PS-032-08-02 (load): 100 accepts per second for 10 min meet R01.
- TEST-PS-032-08-03 (lint): metric labels have no forbidden label.
- TEST-PS-032-08-04 (alert): partial-accept counter above 0 triggers page.

## Acceptance criteria
1. Budgets measured in staging before release gate (future phase).
2. Log sample of 10,000 lines has zero prices or scope text.
3. Partial-accept alert configured.

## Assumptions & open decisions
- ASSUMPTION: starting budgets, revisited after load test.
- Related: D08 offline queue (PROVISIONAL, unapproved). See [DECISIONS.md](../../../DECISIONS.md).
