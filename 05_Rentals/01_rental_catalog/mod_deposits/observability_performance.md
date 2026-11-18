# PS-040-08 — observability performance

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-040-08. **Owner:** [05_Rentals/01_rental_catalog/mod_deposits](SPEC.md). **Implementing module:** 05_Rentals/01_rental_catalog/mod_deposits. **Consumers:** platform observability (F15), operations, privacy review (F10).

## Purpose and scope
Define metrics, latency and error budgets, log fields, and alerts for deposits. Logs and metrics must never contain personal data or raw amounts tied to a person. Budgets are targets for the server path, measured at the platform edge, excluding client network time.

## Requirements
- PS-040-08.R01: Business outcome: operators can see whether deposits are fast, correct and not stuck, without seeing who the parties are. Exclusions: business analytics, participant profiling, and content inspection.
- PS-040-08.R02: Case coverage: spikes in validation errors (possible client bug), rising dependency failures, outbox lag, overdue timers, and unusual dispute rates.
- PS-040-08.R03: Budgets are measured per command class and per query class. Breaches alert before users see failures.
- PS-040-08.R04: Log fields follow the allowlist below. Any field not on the allowlist is dropped at the log shipper.
- PS-040-08.R05: Dashboards display counts and bands, not individual deposits.
- PS-040-08.R06: Accessibility and localization are not runtime metrics here. Client-side accessibility checks belong to the client test plan.

## Metrics
| Metric | Type | Labels | Notes |
|---|---|---|---|
| deposits_command_total | counter | command, outcome (ok, replayed, error), error_code | error_code only from the DEPOSITS_ list |
| deposits_command_latency_ms | histogram | command | server handler time |
| deposits_query_latency_ms | histogram | query | server handler time |
| deposits_transition_total | counter | from_state, to_state | state graph coverage |
| deposits_dependency_errors_total | counter | dependency (rental, identity) | breaker state changes included |
| deposits_breaker_state | gauge | dependency | 0 closed, 1 half-open, 2 open |
| deposits_outbox_lag_seconds | gauge | none | age of oldest unsent row |
| deposits_timer_overdue_seconds | gauge | timer_kind | age of oldest overdue pending timer |
| deposits_dispute_open | gauge | none | count of disputed deposits |
| deposits_rate_limited_total | counter | limit_name | |

## Budgets (A-deposits-26)
| Budget | Target | Alert threshold |
|---|---|---|
| Query latency p95 | 150 ms | 300 ms for 10 minutes |
| Command latency p95 (state commands) | 300 ms | 600 ms for 10 minutes |
| Command latency p99 | 800 ms | 1500 ms for 10 minutes |
| 5xx error rate | under 0.1% of requests | over 0.5% for 5 minutes |
| Validation 4xx rate | informational | sudden 3x increase over 1 hour (client bug signal) |
| Outbox lag p95 | under 5 seconds | over 60 seconds for 5 minutes |
| Timer overdue | under 60 seconds | over 15 minutes at any time |
| Dependency breaker open | none | open for over 2 minutes |

## Log fields
Allowed: timestamp, level, service, request_id, command or query name, outcome, error_code, latency_ms, from_state, to_state, revision, timer_kind, actor_ref, amount_band, currency_code, schema_version, breaker name.

- actor_ref: keyed hash of the participant ID. The key rotates every 24 hours (A-deposits-25). Hash is not reversible by operators.
- amount_band: one of `under_100`, `100_to_999`, `1000_to_9999`, `10000_plus`, computed in major units.

Forbidden in logs and traces: raw participant IDs, deposit_id combined with participant IDs, raw amount_minor, external_ref, evidence contents, request bodies, IP addresses, device identifiers, and any text supplied by a user. Deposit_id alone is allowed in traces only.

## Alerts
- Error budget burn on 5xx: page.
- Outbox lag above threshold: page.
- Timer overdue above threshold: ticket with on-call note.
- Dispute open count rising above 3x its 7-day median: ticket to moderation.
- Breaker open: ticket and page if it persists over 10 minutes.

## Assumptions and open decisions
- A-deposits-25: keyed hash rotation and amount bands.
- A-deposits-26: budgets above are first-pass targets. Load tests confirm them.
- Open: retention for metrics is decided with F15. This file assumes 13 months for aggregates and 30 days for logs.

## Test cases
- TEST-PS-040-08-T01: Run 1000 propose commands in a load test. Pass: command p95 under 300 ms and error rate under 0.1%. Fail: either target missed.
- TEST-PS-040-08-T02: Inspect one command log line for a fixed test participant. Pass: no raw participant ID, no raw amount, no external_ref. Fail: any match.
- TEST-PS-040-08-T03: Stop the outbox worker for 6 minutes. Pass: outbox lag alert fires within 6 minutes. Fail: no alert.
