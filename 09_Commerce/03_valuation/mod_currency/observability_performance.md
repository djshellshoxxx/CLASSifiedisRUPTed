# PS-073-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_currency (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-PRV-001 (R09). **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-073-08.R01 | Metrics: `currency_entries{kind,status}`, `currency_lookups_total`, `currency_cache_hit_ratio`. | MVP |
| PS-073-08.R02 | `currency.get` p95 ≤ 50 ms server side (ASSUMPTION). | MVP |
| PS-073-08.R03 | Alert: any `CURR.LOOKALIKE_UNFLAGGED` attempt; any exponent change on a published version (must be 0). | MVP |
| PS-073-08.R04 | Logs: `currency_id`, code, event type. | MVP |

## Data / schema
Closed label sets.

## Commands / queries / events
Event counts by type.

## States & transitions
Gauge by status.

## Validation & errors
Counter by code.

## Authorization
Operator dashboards.

## Failure, idempotency, concurrency, offline
Cache hit ratio alert.

## Privacy, retention, abuse
Public data; logs 14 days (ASSUMPTION).

## Observability & budgets
Budgets as R02.

## Tests
- TEST-PS-073-08-01 (contract): metric label lint.
- TEST-PS-073-08-02 (integration): exponent change on published version triggers must-be-zero alert.
- TEST-PS-073-08-03 (load): lookup latency budget at 1,000 rps (ASSUMPTION).

## Acceptance criteria
1. Alerts configured and tested.
2. Budgets met in load test.

## Assumptions & open decisions
- D03 (PROVISIONAL default, unapproved).
