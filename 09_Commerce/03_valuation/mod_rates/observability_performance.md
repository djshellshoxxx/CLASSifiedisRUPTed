# PS-075-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_rates (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (Observability section), CTR-PRV-001 (R09), CTR-ERR-001 (R10). **Decisions:** D03 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-075-08.R01 | Metrics: `rate_rounds_total{result}`, `rate_source_latency_ms{source_id}` histogram, `rate_source_divergence_bps{pair}` histogram, `quotes_issued_total{pair}`, `rate_source_status{status}` gauge. | MVP |
| PS-075-08.R02 | `quote.issue` p95 ≤ 500 ms including source fetch; source fetch p95 ≤ 1.5 s (ASSUMPTION). | MVP |
| PS-075-08.R03 | Alerts: source stale > 5 min; divergence > 0.5% on any pair; zero quotes issued for a pair for 10 min during service hours. | MVP |
| PS-075-08.R04 | Logs: `source_id`, pair code, result code, round ID. No party identifier, proposal ID or claim ID. | MVP |
| PS-075-08.R05 | Source-side health is reported per source, not aggregated across sources, so a single failing source is visible. | MVP |

## Data / schema
Closed label sets: pair codes from the registry; `source_id` from the source registry (bounded to registered sources); result codes from PS-075-02.

## Commands / queries / events
Event counts by type (`quote.issued`, `quote.expired`, `rate_source.*`).

## States & transitions
Gauge of sources per status (`active`, `stale`, `disabled`).

## Validation & errors
Counter by `RATE.*` and `SYS.*` code.

## Authorization
Operator dashboards restricted to the Commerce Lead and on-call. Source operators receive no dashboard access (PS-075-05).

## Failure, idempotency, concurrency, offline
Round-level metrics show partial source availability (`sources_responded` histogram). Rounds that refuse issuance are counted, not silently dropped.

## Privacy, retention, abuse
Metrics 90 days; logs 14 days (ASSUMPTION). Divergence history used for source review is retained 90 days.

## Observability & budgets
- Budgets as R02.
- Quote issuance rate: up to 50 rounds per minute across all pairs (ASSUMPTION).
- Staleness check runs every 60 s per active source (ASSUMPTION).

## Tests
- TEST-PS-075-08-01 (contract): metric label lint; no party or claim identifier present.
- TEST-PS-075-08-02 (integration): one stale source triggers alert and is excluded from rounds.
- TEST-PS-075-08-03 (integration): divergence above 0.5% triggers alert and refuses issuance.
- TEST-PS-075-08-04 (load): 200 quote requests per second within R02 budgets (ASSUMPTION).

## Acceptance criteria
1. All alerts configured and tested in staging.
2. R02 budgets met in load test.
3. Log lint finds no party or claim identifier.

## Assumptions & open decisions
- ASSUMPTION: round rate, staleness check interval, retention values.
- D03 (PROVISIONAL default, unapproved).
