# PS-032-08 — observability performance

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-032-08. **Owner:** [03_Services/02_service_booking/mod_quotes](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_quotes. **Consumers:** candidate consumers in domain_schema.md Section 6; subscriber map pending F15 registry.

## Purpose and scope
Defines metrics, latency and error budgets, alert thresholds and the log field allowlist for quotes. Business outcome: operators can see whether quotes are fast, correct and delivering events, and can diagnose a failure without reading personal data.

Exclusions: business analytics on pricing, user behavior tracking, and any personal-data telemetry. Budgets are v1 targets, not measured baselines (A-quotes-22).

## Requirements
- PS-032-08.R01: Metrics in Section 1 are emitted for every command, query, job and outbox publish.
- PS-032-08.R02: Normal, invalid, expired, duplicate, concurrent, offline and adversarial conditions produce the telemetry listed in Section 4 and are tested in TEST-PS-032-08-T01 to T04.
- PS-032-08.R03: Client accessibility and performance: quote view meets WCAG 2.2 AA contrast and focus rules, and reaches first meaningful paint within 2.5 seconds on a mid-tier phone over a 4G profile.
- PS-032-08.R04: Metric labels never contain participant IDs, quote IDs, free text or amounts. Quote IDs appear only in logs and traces, under the allowlist in Section 3.
- PS-032-08.R05: Budgets in Section 2 are the alert thresholds. Breach opens an alert; it does not auto-disable commands.
- PS-032-08.R06: Log entries follow the allowlist in Section 3. Entries with forbidden fields are dropped at the emitter.

## 1. Metrics
| Metric | Type | Labels | Notes |
|---|---|---|---|
| quotes_command_total | counter | command, outcome (ok, error), error_code | error_code from catalogue |
| quotes_command_latency_seconds | histogram | command | server-side, excludes client network |
| quotes_query_latency_seconds | histogram | query | |
| quotes_version_conflicts_total | counter | command | |
| quotes_idempotent_replays_total | counter | command | |
| quotes_status_transitions_total | counter | from_status, to_status | |
| quotes_expiry_processed_total | counter | outcome | rows moved to EXPIRED |
| quotes_expiry_lag_seconds | histogram | none | now minus `valid_until` at expiry |
| quotes_outbox_pending | gauge | none | unpublished rows |
| quotes_outbox_lag_seconds | histogram | none | `published_at` minus `occurred_at` |
| quotes_outbox_dead_letter_total | counter | event_type | |
| quotes_rate_limited_total | counter | command | |
| quotes_dependency_latency_seconds | histogram | dependency (identity, catalog, request_owner) | |
| quotes_dependency_timeouts_total | counter | dependency | |

## 2. Budgets and alert thresholds (v1 targets)
| Budget | Target | Alert when |
|---|---|---|
| Command p95 latency (create, revise, issue, withdraw, respond) | ≤ 400 ms | > 400 ms for 15 minutes |
| Query p95 latency (get, get_revision) | ≤ 200 ms | > 200 ms for 15 minutes |
| List p95 latency (limit 50) | ≤ 300 ms | > 300 ms for 15 minutes |
| Server error rate (5xx / all requests) | < 0.1% over 1 hour | ≥ 0.5% over 10 minutes |
| Version conflict rate on respond | < 3% | ≥ 5% over 1 hour |
| Outbox lag p95 | ≤ 5 seconds | > 30 seconds for 10 minutes |
| Expiry lag p95 | ≤ 90 seconds after `valid_until` | > 300 seconds for 10 minutes |
| Dead-letter events | 0 per day | Any increase |
| Dependency timeout rate (identity) | < 1% | ≥ 5% over 10 minutes |

Load budget: 50 concurrent users per instance with mixed workload (60% query, 30% respond or issue, 10% create) at target latencies. Load test is TEST-PS-032-08-T03.

## 3. Log field allowlist
Allowed fields: `ts` (RFC 3339 UTC), `level`, `request_id`, `command` or `query`, `quote_id` (internal ID, logs and traces only), `status_from`, `status_to`, `error_code`, `retryable`, `latency_ms`, `schema_version`, `participant_token` (keyed hash of participant ID, rotated daily), `dependency`, `diagnostic_id`, `version`.

Forbidden in any log, trace or metric: `description`, `notes`, `counter_note`, `case_ref` free text, amounts (`total_minor`, `unit_price_minor` and similar), participant IDs in clear, IP addresses, device identifiers, coordinates, region codes below coarse class, names, email, phone, and request or response bodies. The emitter drops unknown fields.

Amounts for operational reconciliation are available only through the audited operator read path (authorization_capabilities.md), never through logs.

## 4. Telemetry by condition
| Class | Condition | Expected telemetry | Test |
|---|---|---|---|
| normal | Successful issue and accept | Counters ok; latency histograms; transition counter | T01 |
| invalid | Validation rejects amount | Counter with error_code; no amount logged | T02 |
| expired | Expiry job runs | expiry_processed and expiry_lag observed | T04 |
| duplicate | Idempotent replay | idempotent_replays_total incremented | T01 |
| concurrent | Version conflict | version_conflicts_total incremented | T03 |
| offline | Client pending queue flushes | No server metric change beyond normal command metrics | T03 |
| adversarial | Burst of creates | rate_limited_total incremented; no per-participant metric label | T02 |

## Assumptions and open decisions
- A-quotes-22: Budgets are v1 targets and are not measured baselines. They are re-validated in TEST-PS-032-08-T03.
- Participant token rotation daily is a recommended default. The keyed hash uses a platform secret owned by F16.
- No business metrics about pricing or amounts are emitted (Exclusions).
- D05 (open, DECISIONS.md) does not affect telemetry in v1 because no precise location is stored.
