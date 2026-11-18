# PS-028-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/01_service_catalog/mod_availability. **Parent:** [mod_availability SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001, CTR-EVT-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-028-08.R01 | Slot search p95 ≤ 150 ms for a 31-day range (ASSUMPTION). | MVP |
| PS-028-08.R02 | Hold expiry lag p95 ≤ 90 s (PS-028-06 R02). | MVP |
| PS-028-08.R03 | Logs: `code`, `request_id`, module, timing only. No window times, timezones, regions or `acc_` IDs. | MVP |
| PS-028-08.R04 | Enumeration alert: one principal with > 50 `SYS.NOT_FOUND` responses in 10 min triggers review (ASSUMPTION). | MVP |

## Data / schema
Metric labels allowed: `action`, `code`, `state`, `kind`. Forbidden: `acc_`, `srv_`, `avw_`, timezone, region, time values.

## Commands / queries / events
Spans carry `request_id` and `correlation_id` (`cor_`).

## States & transitions
State metrics from PS-028-03.

## Validation & errors
`svcavail_validation_rejections_total{code}`.

## Authorization
Operator dashboards show counts only; no `ope` access to schedules.

## Failure, idempotency, concurrency, offline
Telemetry best-effort. Client offline queue depth reported as aggregate count.

## Privacy, retention, abuse
Telemetry kept 30 days (ASSUMPTION). Scrubbing allowlist. Enumeration alerts reported to F12 as counts only.

## Observability & budgets
| Metric | Target |
|---|---|
| `svcavail_search_latency_seconds` p95 | ≤ 0.15 s |
| `svcavail_hold_expiry_lag_seconds` p95 | ≤ 90 s |
| `svcavail_double_booking_total` | 0 |
| 5xx rate | ≤ 0.1% |

## Tests
- TEST-PS-028-08-01 (unit): log formatter drops window times and regions.
- TEST-PS-028-08-02 (load): 500 searches per second for 10 min meet R01.
- TEST-PS-028-08-03 (lint): metric labels contain no forbidden label.
- TEST-PS-028-08-04 (integration): enumeration alert fires at 51 `SYS.NOT_FOUND` in 10 min.

## Acceptance criteria
1. Budgets measured in staging before release gate (future phase).
2. Log sample of 10,000 lines contains zero schedule values.
3. Double-booking metric alert configured at > 0.

## Assumptions & open decisions
- ASSUMPTION: starting budgets revised after load tests.
- Related: D08 offline queue (PROVISIONAL, unapproved). See [DECISIONS.md](../../../DECISIONS.md).
