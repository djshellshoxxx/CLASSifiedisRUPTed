# PS-039-08 — observability performance

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-039-08. **Owner:** [05_Rentals/01_rental_catalog/mod_availability](SPEC.md). **Implementing module:** 05_Rentals/01_rental_catalog/mod_availability. **Consumers:** 05_Rentals/02_rental_lifecycle (latency of commit), operations dashboards, observability (F15); shared F15 platform, F16 security per [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Requirements
- PS-039-08.R01: Each command, query and job has a latency budget, an error-rate budget and a named metric. Budgets are measured, not assumed, in later phases.
- PS-039-08.R02: Logs and traces use the field set below. No personal data, pseudonym, coordinates or free text is logged.
- PS-039-08.R03: Alerts and dashboards are defined for conflict spikes, sweep lag and outbox backlog, with thresholds stated here.

## Metrics
| Metric | Type | Labels | Notes |
|---|---|---|---|
| avail_command_latency_ms | histogram | command, outcome_code | per command |
| avail_query_latency_ms | histogram | query, range_bucket | range_bucket: <=7d, <=92d, <=366d |
| avail_command_errors_total | counter | command, code | codes from validation_rules.md |
| avail_claim_conflicts_total | counter | listing_bucket | conflicts per hour, no listing ID |
| avail_hold_expired_total | counter | none | |
| avail_sweep_lag_seconds | gauge | none | now minus oldest expired-but-held claim |
| avail_outbox_backlog | gauge | none | rows not yet published |
| avail_idempotent_replay_total | counter | command | |
| avail_lock_wait_ms | histogram | none | per-listing lock wait |

Labels never include participant IDs, claim IDs or listing IDs. `listing_bucket` is a salted hash bucket of 64 values.

## Budgets
| Operation | p95 latency | p99 latency | Error budget (5xx or AVAIL_UNAVAILABLE) |
|---|---|---|---|
| avail.claim.hold | 300 ms | 800 ms | 0.5% of requests per 30 days |
| avail.claim.commit | 300 ms | 800 ms | 0.5% |
| avail.window.publish, avail.block.create | 300 ms | 800 ms | 0.5% |
| avail.query.calendar (<=92 days) | 150 ms | 400 ms | 0.5% |
| avail.query.calendar (<=366 days, owner) | 400 ms | 1000 ms | 0.5% |
| Sweep job, per batch of 200 | 500 ms | 2 s | none |

Business-rule rejections (validation, conflict, authorization) are not counted against the error budget. Their rate is tracked separately to detect misuse.

Load targets for later verification: 50 hold requests per second sustained per deployment with budgets met; calendar reads at 500 per second with the query budget met.

## Log fields
Each command log line contains: `timestamp_utc`, `request_id`, `command`, `actor_role` (anonymous, owner, requester, lifecycle, operator), `actor_key` (salted hash, rotated daily), `outcome_code`, `latency_ms`, `schema_version`, `replayed` (boolean), `revision` (integer).

Forbidden in logs: participant IDs, claim IDs, window IDs, listing IDs in clear text, dates of individual claims, timezone, free text, IP address, device identifiers, user agent. Correlation uses `request_id`, which carries no personal data.

## Traces
- One span per command with child spans for authorization, lock acquisition, database transaction and outbox write.
- Span attributes follow the log field rules above.
- Sampling: 100% of error and conflict spans, 10% of successful spans.

## Alerts
| Alert | Threshold | Window |
|---|---|---|
| Write p95 over budget | > 300 ms | 10 minutes |
| Error budget burn | > 2% of requests returning 5xx | 15 minutes |
| Conflict spike | conflicts > 3x 7-day median | 1 hour |
| Sweep lag | > 120 s | 5 minutes |
| Outbox backlog | > 10,000 rows or oldest row > 10 minutes | 5 minutes |
| Lock wait p95 | > 250 ms | 10 minutes |

Alerts go to the on-call operations rota. Alert payloads follow the same field rules.

## Operational dashboards
- Per-command latency and error codes.
- Holds created, committed, released and expired per day (counts only).
- Calendar query volume by range bucket.
- Sweep lag and outbox backlog.

## Open decisions
- A-AVAIL-25: Latency budgets (p95 300 ms writes, 150 ms public calendar) are defaults chosen for a mobile-first PWA and are not measured figures.
- A-AVAIL-26: Actor key is a salted hash rotated daily. Rotation prevents long-term linking of log lines to a participant.
