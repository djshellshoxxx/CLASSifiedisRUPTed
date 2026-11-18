# PS-030-08 — observability performance

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-030-08. **Owner:** [03_Services/02_service_booking/mod_disputes](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_disputes. **Consumers:** F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); event subscribers in [commands_queries_events.md](commands_queries_events.md).

## Purpose and scope
Defines the metrics, latency and error budgets, alerts, traces and log fields for the dispute module. Operators must be able to see health, backlog and deadline risk without reading dispute content. No log, metric label or trace attribute may carry personal data.

Exclusions: dashboard tooling choice (F15); on-call rota (F16 governance); user-facing analytics (none in v1).

## Requirements
- **PS-030-08.R01**: Business outcome: operators can detect stuck timers, outbox lag, error spikes and reviewer SLA risk within 5 minutes, and can trace one command end to end by `correlation_id`. Actors: operators, on-call. Exclusions as above.
- **PS-030-08.R02**: Cases covered: latency regression on a write path, timer backlog after outage, outbox publish failure, booking dependency breaker open, evidence finalize failure rate, rising intake rejections (possible abuse), review SLA breach cluster, idempotency conflict spike (possible client bug).
- **PS-030-08.R03**: Budgets (p95 unless stated): command write 600 ms; query read 300 ms; evidence finalize 2 s server-side excluding client upload; timer lag 60 s; outbox publish lag 30 s. Availability target for command and query endpoints: 99.9% monthly. 5xx rate budget: at most 0.5% over any 5-minute window. Conflict (409) rate on writes: at most 2% over 1 hour.
- **PS-030-08.R04**: Log fields exclude personal data. Participant identity appears only as a keyed hash (`actor_hash`, HMAC with a rotating key, 90-day rotation).
- **PS-030-08.R05**: Each command emits one structured log line, one latency sample and one trace. Trace sampling: 100% for error and 409 responses, 10% otherwise.
- **PS-030-08.R06**: Dashboard and alert definitions are reviewed as part of the Prompt 3 completeness review; this file defines the required signals only.

## Metrics
| Metric | Type | Labels (bounded) | Purpose |
|---|---|---|---|
| disputes_command_total | counter | command, outcome (ok, error_code) | throughput and errors |
| disputes_command_latency_ms | histogram | command | write budget |
| disputes_query_latency_ms | histogram | query | read budget |
| disputes_opened_total | counter | category | demand by category |
| disputes_transition_total | counter | from_status, to_status | flow health |
| disputes_state_age_seconds | histogram | status | time in state; alerts on long `under_review` |
| disputes_timer_lag_seconds | gauge | timer | overdue timer backlog |
| disputes_timer_fired_total | counter | timer, result (applied, superseded) | timer correctness |
| disputes_outbox_pending | gauge | none | publish backlog |
| disputes_outbox_lag_seconds | histogram | none | event delay |
| disputes_idempotency_replay_total | counter | command | replay rate |
| disputes_idempotency_conflict_total | counter | command | key reuse with different body |
| disputes_evidence_finalize_total | counter | kind, result | upload health |
| disputes_evidence_quarantine_total | counter | reason_code | malware or metadata failures |
| disputes_dependency_breaker_state | gauge | dependency (booking, identity, upload) | breaker state |
| disputes_review_sla_breach_total | counter | none | reviewer capacity |
| disputes_intake_reject_total | counter | reason_code | abuse signal |
| disputes_flag_total | counter | flag (contact_detail, repetition) | moderation signal |

Label values come from closed enums. `dispute_id`, `actor_hash` and free text are never metric labels.

## Budgets and alerts
| Signal | Threshold | Severity |
|---|---|---|
| Command p95 latency over 600 ms for 10 min | breach | warning |
| Query p95 latency over 300 ms for 10 min | breach | warning |
| 5xx rate over 0.5% for 5 min | breach | page |
| disputes_timer_lag_seconds over 300 s | breach | page |
| disputes_outbox_lag_seconds p95 over 30 s for 10 min | breach | warning |
| Outbox row older than 15 min | any | page |
| Breaker open longer than 5 min | any | warning |
| Evidence finalize failure over 5% in 15 min | breach | warning |
| Idempotency conflicts over 1% of writes for one actor in 1 hour | breach | ticket (possible client defect or abuse) |
| Review SLA breaches over 10 in 24 h | breach | warning (capacity) |
| Intake rejections over 20 in 24 h platform-wide | breach | warning (abuse review) |

## Log fields
Each command produces one JSON line:
```json
{
  "ts": "2026-11-10T08:15:00.123Z",
  "service": "disputes",
  "schema_version": 1,
  "command": "RespondToDispute",
  "correlation_id": "01J9ZR7H8J9K0M1N2P3Q4R5S6T",
  "dispute_id": "dsp_01J9ZQ3M7H2K4V8W6X0R5T1N3E",
  "actor_role": "respondent",
  "actor_hash": "b7e2a1c0d9f84e6a",
  "outcome": "ok",
  "error_code": null,
  "from_status": "open",
  "to_status": "responded",
  "duration_ms": 142,
  "dependency_calls": 0,
  "idempotent_replay": false
}
```
Allowed fields: the set above plus `revision`, `attempt`, `timer`, `breaker_state`, `reason_code`. `dispute_id` is an opaque internal ID and is allowed in logs and traces, not in metric labels.

Forbidden in logs, metrics, traces and error diagnostics: statement or decision text, evidence content or file names, labels, contact details, IP addresses, device identifiers, exact or approximate coordinates, raw participant IDs, request bodies, and access tokens. A redaction test runs on every log schema change ([contract_and_acceptance_tests.md](contract_and_acceptance_tests.md)).

## Traces
- One trace per request. Spans: authorization, idempotency lookup, dispute lock, domain write, outbox write, response. Dependency spans for booking, identity and upload are named by dependency, with no payload attributes.
- Timer runs produce one trace per batch, not per dispute, with dispute count as an attribute.

## Open decisions
- A-disputes-07: Budgets and deadlines are defaults; first pilot data will confirm or adjust the p95 targets.
- A-disputes-19: Feature flag status is exported as a gauge `disputes_enabled` (0 or 1) and included in the operator dashboard requirement.
- Accessibility and localization performance (UI) are specified with the client surfaces and are not measured by this server module.
