# PS-073-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_currency (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R03, R10), CTR-PRV-001 (R09), CTR-ERR-001 (R10). **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-073-08.R01 | Metrics: `currency_entries{kind,status}` gauge, `currency_lookups_total{cache_result}`, `currency_cache_hit_ratio`, `currency_release_total{result}`. Labels are enums only. | MVP |
| PS-073-08.R02 | `currency.get` p95 ≤ 50 ms server side, ≤ 5 ms from client cache (ASSUMPTION). | MVP |
| PS-073-08.R03 | Alert: any `CURR.LOOKALIKE_UNFLAGGED` attempt (page Commerce Lead); any change of `exponent` on a published version (must be 0). | MVP |
| PS-073-08.R04 | Alert: cache hit ratio below 95% for 15 min (ASSUMPTION; indicates registry outage or misconfigured clients). | MVP |
| PS-073-08.R05 | Logs: `currency_id`, `version`, event type, error code. No user identifiers, IP addresses or client identifiers. | MVP |

## Data / schema
Closed label sets: `kind` (fiat, asset), `status` (enabled, disabled, deprecated), `cache_result` (hit, miss, stale). Entry identifiers are not metric labels.

## Commands / queries / events
Counts by event type (`currency.registered`, `currency.status_changed`); no per-entry counters.

## States & transitions
Gauge of entries by status, derived from events.

## Validation & errors
Counter by `CURR.*` and `SYS.*` code.

## Authorization
Operator dashboards restricted to the Commerce Lead and on-call; registry contents are public, but operator dashboards are not.

## Failure, idempotency, concurrency, offline
Cache hit ratio and stale-serve counts show registry outages. Release failures are counted by result.

## Privacy, retention, abuse
Metrics 90 days; logs 14 days (ASSUMPTION). No client-level telemetry is collected from the offline cache.

## Observability & budgets
- Lookup and cache budgets as R02.
- Release process duration p95 ≤ 30 s for 10,000 entries (ASSUMPTION).
- Event lag from write to cache-invalidation p95 ≤ 60 s (ASSUMPTION).

## Tests
- TEST-PS-073-08-01 (contract): metric label lint; no entry identifier as label.
- TEST-PS-073-08-02 (integration): exponent change on a published version triggers must-be-zero alert.
- TEST-PS-073-08-03 (integration): cache hit ratio alert fires after simulated registry outage.
- TEST-PS-073-08-04 (load): lookup latency budget at 1,000 requests per second (ASSUMPTION).

## Acceptance criteria
1. All alerts configured and tested in staging.
2. Budgets met in load test.
3. Log lint finds no user identifier.

## Assumptions & open decisions
- ASSUMPTION: metric and log retention values; cache invalidation budget.
- D03 (PROVISIONAL default, unapproved).
