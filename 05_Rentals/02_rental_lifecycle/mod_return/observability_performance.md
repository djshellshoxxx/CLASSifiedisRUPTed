# PS-043-08 — observability performance

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-043-08. **Owner:** [05_Rentals/02_rental_lifecycle/mod_return](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_return. **Consumers:** F15 observability and operations, on-call operators, F10 (log retention).

## Purpose and scope
Defines the metrics, latency and error budgets, alert thresholds and log fields that let operators run the return flow without reading personal data. Budgets are server-side unless stated otherwise.

**Exclusions:** client-side rendering performance of other modules; business KPIs beyond aggregate counts; infrastructure sizing (F15).

## Requirements
- PS-043-08.R01: Business outcome: operators can see whether returns are being declared, confirmed, disputed and timed out, and whether the service is healthy, with aggregate data only.
- PS-043-08.R02: Case coverage: outbox backlog, projection outage, circuit open, scheduler lag, dead letters, rate-limit spikes, error spikes, duplicate event publish, idempotent replays.
- PS-043-08.R03: Accessibility of operator dashboards: each chart has a text summary and does not rely on colour alone (dataviz guidance applies).
- PS-043-08.R04: Latency budgets in Table 2 are measured server-side at the API boundary, p95 over a rolling 15-minute window.
- PS-043-08.R05: Logs contain only the allowlisted fields in Table 3; the test in PS-043-09 fails on any other field.

## Table 1 — metrics
| Metric | Type | Labels (bounded) |
|---|---|---|
| rental_return_commands_total | counter | command (7 values), outcome (ok or error code from validation table) |
| rental_return_command_latency_ms | histogram | command |
| rental_return_transitions_total | counter | from_state, to_state |
| rental_return_active_returns | gauge | state (9 values); aggregate counts only |
| rental_return_outbox_lag_seconds | histogram | none |
| rental_return_outbox_dead_letter_total | counter | none |
| rental_return_scheduler_lag_seconds | gauge | timer name (4 values) |
| rental_return_projection_calls_total | counter | result (ok, timeout, error, breaker_open) |
| rental_return_circuit_state | gauge | dependency (projection, moderation) |
| rental_return_rate_limited_total | counter | command |
| rental_return_replays_total | counter | command |

No metric label contains a participant identifier, return_id, rental_id, note content or location. Series cardinality must stay under 500 (TEST-PS-043-08-T01).

## Table 2 — budgets
| Operation | p95 server latency | p99 server latency | Error budget (5xx share, 15 min) |
|---|---|---|---|
| InitiateReturn | 300 ms | 800 ms | 0.1% |
| DeclareReturn, CancelReturn | 250 ms | 700 ms | 0.1% |
| ConfirmReturn, DisputeReturn | 250 ms | 700 ms | 0.1% |
| ResolveReturnDispute | 250 ms | 700 ms | 0.1% |
| GetReturn | 120 ms | 300 ms | 0.05% |
| ListReturnsByRental (limit 50) | 200 ms | 500 ms | 0.05% |
| Outbox publish lag | 5 s | 30 s | not applicable |
| Scheduler sweep lag | 5 min | 10 min | not applicable |

Client-observed budgets (PWA, on a reference 4G profile): command acknowledgment p95 800 ms excluding user input time. These are targets for PS-043-09 tests, not server guarantees.

Load profile for budget verification: 50 commands per second mixed, 10 minutes, on the reference staging size (sizing owned by F15).

## Table 3 — log fields (allowlist)
| Field | Type | Notes |
|---|---|---|
| ts | RFC 3339 UTC | |
| level | enum | |
| module | string | constant `F05.S02.M02` |
| event | enum | e.g. command_completed, transition_applied, timer_fired, outbox_published, circuit_opened |
| command | enum | |
| outcome | string | ok or error code |
| return_id | ULID | allowed; retained 30 days |
| from_state, to_state | enum | |
| revision | integer | |
| latency_ms | integer | |
| attempt | integer | |
| idempotent_replay | boolean | |
| schema_version | integer | |
| actor_ref | string | keyed HMAC of participant_id, key rotated every 30 days (A-return-30) |
| trace_id, span_id | string | |

Forbidden in logs: renter_note, owner_note, dispute text, participant_id (raw), returned_at value, return_point_ref, IP address, user agent string, request body, response body, email, name, coordinates.

## Alerts
| Alert | Condition | Severity |
|---|---|---|
| Command 5xx | 5xx share > 0.5% for 5 min on any command | page |
| Outbox lag | p95 > 30 s for 10 min | page |
| Dead letter | any increment of outbox_dead_letter_total | ticket, then page if repeated |
| Scheduler lag | > 15 min | page |
| Projection breaker open | open > 2 min | page |
| Rate-limit spike | rate_limited_total > 5x its 7-day hourly median for 15 min | ticket |
| Declaration backlog | count of declared returns older than 14 days > 2x its 7-day median | ticket (business) |

## Tracing and sampling
- Trace all commands; head sampling 10% for successful reads; 100% of errors and timers.
- Span attributes follow the Table 3 allowlist.

## Open decisions
- A-return-29: Latency and error budgets in Table 2 are MVP defaults for the reference staging size; they are to be confirmed under load testing in Stage 4.
- A-return-30: actor_ref uses a 30-day rotating HMAC key managed by F15; raw participant identifiers never reach log storage.
