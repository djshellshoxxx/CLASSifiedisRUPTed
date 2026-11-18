# PS-042-08 — observability performance

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-042-08. **Owner:** [05_Rentals/02_rental_lifecycle/mod_handoff](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_handoff. **Consumers:** provisional, per [dependency matrix](../../../DEPENDENCY_MATRIX.md) and sibling [mod_return](../mod_return/SPEC.md); subscriber map confirmed in Prompt 3.

## Purpose and scope
Defines metrics, performance budgets, alert thresholds, log fields and traces for mod_handoff, plus accessibility and localization budgets. Budgets are concrete defaults for review. They are not measurements, and nothing here claims a measured result.

## Requirements
- PS-042-08.R01 — Business outcome: operators can see whether handoffs are completing, expiring or stalling, without seeing who the participants are.
- PS-042-08.R02 — Cases covered: latency spike on confirm; agreement dependency timeouts; outbox lag; scheduler falling behind; dispute backlog; offline queue overflow; error spikes caused by clients on old schema versions; log lines that would leak notes or identifiers.
- PS-042-08.R03 — Accessibility and localization budgets: WCAG 2.2 AA for every handoff screen; 44 × 44 CSS px minimum touch target; state conveyed by text and icon, not colour alone; every user-facing string resolved from a message key; dates and times shown in viewer locale and timezone; right-to-left layouts tested for the handoff card and confirm dialog; screen-reader announcement within 1 s of a confirm result.
- PS-042-08.R04 — Operational budgets apply in the relay's own region and are measured at the server, excluding client network time.

## Performance budgets
| Measure | Budget (default) | Measured at |
|---|---|---|
| Command p95 latency | ≤ 300 ms | relay, for create, confirm, respond, cancel, dispute |
| Command p99 latency | ≤ 1000 ms | relay |
| Query p95 latency | ≤ 150 ms | relay, `handoff.get` and `handoff.list` |
| Command 5xx error rate | ≤ 0.5% over 5 minutes | relay; `HANDOFF_UPSTREAM_UNAVAILABLE` counts, 4xx does not |
| Outbox publish lag p95 | ≤ 5 s | outbox to broker |
| Outbox publish lag p99 | ≤ 30 s | outbox to broker |
| Timer expiry lag p95 | ≤ 5 min past deadline | scheduler |
| Offline queue drain p95 | ≤ 60 s after reconnect | client telemetry, opt-in, aggregated |
| Sustained command throughput | 200 per second per relay shard | load test, see TEST-PS-042-08-T04 |

## Metrics
| Metric | Type | Labels (allowed) |
|---|---|---|
| `handoff_command_total` | counter | command, outcome code, schema_version |
| `handoff_command_latency_ms` | histogram | command |
| `handoff_transition_total` | counter | transition ID (T01–T15) |
| `handoff_state_gauge` | gauge | state (8 values), no IDs |
| `handoff_dispute_open` | gauge | none |
| `handoff_dispute_age_seconds` | histogram | none |
| `handoff_expired_total` | counter | terminal reason |
| `handoff_idempotent_replay_total` | counter | command |
| `handoff_outbox_lag_seconds` | histogram | none |
| `handoff_dependency_timeout_total` | counter | dependency (agreement, catalog, evidence) |
| `handoff_rate_limited_total` | counter | command |

## Alerts (default thresholds)
- Command 5xx rate above 0.5% for 5 minutes: page.
- Outbox lag p99 above 30 s for 10 minutes: page.
- Timer expiry lag p95 above 5 min for 15 minutes: ticket.
- Dispute age above 7 days for any open dispute: operator alert (matches [A-handoff-07](workflow_state_machine.md)).
- Idempotent replay rate above 5% for 15 minutes: ticket (possible client retry storm).
- Dependency timeout rate above 5% for 5 minutes: page.

## Log fields
Allowed: `timestamp`, `request_id`, `command`, `outcome_code`, `schema_version`, `transition_id`, `handoff_id` (opaque ULID), `participant_ref` (keyed hash of participant ID, rotated monthly), `latency_ms`, `shard`, `revision`.

Forbidden in logs, traces and metrics: `meeting_note`, `condition_note`, `dispute_reason_code` text, `region_code`, raw `participant_id`, `rental_agreement_id` in plain form, `item_ref`, IP address, user agent string, device identifiers, any evidence content or hash of evidence content. The logger rejects these keys at the schema level, and a test asserts it ([TEST-PS-042-08-T02](contract_and_acceptance_tests.md)).

## Traces
- One span per command with child spans for the agreement lookup, the database transaction and the outbox write.
- Span attributes use the allowed log fields only.
- Trace sampling: 100% for error outcomes, 10% for success, always-on for `HANDOFF_CONFLICT_REVISION` bursts.

## Assumptions and open decisions
- No assumptions are defined in this file. Budgets above are defaults for review.
- Open decisions in this file: none specific. Dashboard tool choice belongs to F15 and is not defined here.
