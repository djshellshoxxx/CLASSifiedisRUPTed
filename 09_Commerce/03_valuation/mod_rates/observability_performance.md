# PS-075-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_rates (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (Observability), CTR-PRV-001 (R09). **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-075-08.R01 | Metrics: `rate_rounds_total{result}`, `rate_source_latency_ms{source}`, `rate_source_divergence{pair}`, `quotes_issued_total{pair}`. | MVP |
| PS-075-08.R02 | `quote.issue` p95 ≤ 500 ms (ASSUMPTION). | MVP |
| PS-075-08.R03 | Alerts: source stale > 5 min; divergence > 0.5%; zero quotes issued for a pair for 10 min. | MVP |
| PS-075-08.R04 | Logs: source ID, pair, result code. No party IDs. | MVP |

## Data / schema
Closed label sets: pair codes from registry.

## Commands / queries / events
Event counts.

## States & transitions
Gauge: sources per state.

## Validation & errors
Counter by code.

## Authorization
Operators only.

## Failure, idempotency, concurrency, offline
Source health gauge.

## Privacy, retention, abuse
Metrics 90 days; logs 14 days (ASSUMPTION).

## Observability & budgets
As R02.

## Tests
- TEST-PS-075-08-01 (contract): label lint.
- TEST-PS-075-08-02 (integration): stale source triggers alert.
- TEST-PS-075-08-03 (load): 200 quote requests per second within budget (ASSUMPTION).

## Acceptance criteria
1. Alerts tested.
2. Budgets met in load test.

## Assumptions & open decisions
- D03 (PROVISIONAL default, unapproved).
