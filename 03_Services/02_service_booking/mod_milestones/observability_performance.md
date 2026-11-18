# PS-031-08 — observability performance

**Status:** SPECIFIED — Stage 3 draft, pending review.
**Requirement ID:** PS-031-08. **Owner:** [03_Services/02_service_booking/mod_milestones](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_milestones. **Consumers:** F07 identity, F10 privacy, F15 platform, F16 security (per [dependency matrix](../../../DEPENDENCY_MATRIX.md)); operators of F15 observability.

## Purpose and scope
Business outcome: operators can tell within 5 minutes whether milestone commands are slow, failing, or stuck, and can do so without reading any personal or commerce content.

Exclusions: product analytics on user behavior; business reporting on amounts; user-facing status pages (F15).

## Requirements
- PS-031-08.R01: Metrics, logs and traces are emitted for every command, query, timer and outbox publish, with the field whitelist below. Anything outside the whitelist is dropped at the emitter.
- PS-031-08.R02: Alerts fire on the thresholds in the budget table. Each alert names a runbook section (owner F15).
- PS-031-08.R03: Budgets (server-side, measured at the service boundary, excluding client network time): see budget table. Load test target: 200 write requests per second and 800 read requests per second for 30 minutes on reference hardware with no error budget breach.

## Metrics
| Metric | Type | Labels | Notes |
|---|---|---|---|
| milestones_command_total | counter | command, result_code | result_code is the error code or `OK` |
| milestones_command_latency_seconds | histogram | command | buckets 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 3 |
| milestones_query_latency_seconds | histogram | query | same buckets |
| milestones_idempotent_replay_total | counter | command | replayed results |
| milestones_revision_conflict_total | counter | command | optimistic lock conflicts |
| milestones_dependency_latency_seconds | histogram | dependency (booking, quote, dispute) | timeouts counted separately |
| milestones_dependency_breaker_state | gauge | dependency | 0 closed, 1 half-open, 2 open |
| milestones_timer_run_total | counter | timer, outcome | expiry, review_overdue, mutual_cancel, stall |
| milestones_timer_rows_changed | counter | timer | rows updated per run |
| milestones_outbox_lag_seconds | gauge | none | age of oldest unpublished row |
| milestones_outbox_publish_failures_total | counter | none | |
| milestones_plans_by_state | gauge | plan_state | sampled every 5 min; no booking labels |

## Budgets and alerts
| Indicator | Budget | Alert threshold | Window |
|---|---|---|---|
| Write command p95 latency | 250 ms | > 250 ms for 10 min | rolling 10 min |
| Read command p95 latency | 150 ms | > 150 ms for 10 min | rolling 10 min |
| Plan get p95 with 50 items | 150 ms | > 150 ms | rolling 10 min |
| 5xx error rate (write and read) | < 0.1 % | > 0.5 % for 5 min | rolling 5 min |
| MILESTONES_INTERNAL rate | < 0.01 % | any sustained over 1 min | rolling 1 min |
| Revision conflict rate | < 2 % of writes | > 5 % for 15 min | rolling 15 min |
| Outbox lag p95 | 5 s | > 60 s for 5 min | rolling 5 min |
| Timer run success | 100 % | any failed run | per run |
| Expiry timer lag | 15 min | > 30 min | per run |
| Dependency timeout rate | < 1 % | > 5 % for 5 min | rolling 5 min |

Error budget: 99.9 % availability for writes over 30 days, measured as non-5xx responses; `MILESTONES_FEATURE_DISABLED` counts as unavailable only when the flag is on.

## Logs
Each log line is one JSON object. Allowed fields only:
`ts` (UTC), `level`, `request_id` (ULID), `command` or `query` or `timer`, `result_code`, `http_status`, `latency_ms`, `plan_id` (ULID, internal), `item_id` (ULID, internal), `plan_state`, `milestone_state`, `row_version`, `actor_hash` (HMAC, 16 hex), `role` (provider, client, operator, system), `dependency`, `attempt`, `build_version`.

Forbidden in logs: title, description_text, note_text, evidence_uri, evidence_digest, reason_text, raw participant IDs, amounts (amounts are commerce evidence; aggregate counts only), request bodies, stack traces that include request data, IP addresses (handled by F15 edge only).

Log level rules: `info` for each successful command; `warn` for validation rejects that are user errors (sampled at 10 %); `error` for `MILESTONES_INTERNAL` and dependency timeouts (never sampled). Retention per privacy_retention_abuse.md.

## Traces
One trace per command. Spans: `auth`, `capability`, `load_plan`, `validate`, `db_tx`, `outbox_insert`, `dependency:<name>`. Span attributes follow the log whitelist. Trace sampling: 10 % of successful requests, 100 % of errors.

## Performance design
- Plan read uses one indexed query on `plan_id` plus one on `milestone (plan_id, sequence_no)`; no join to booking or quote on the read path. The booking and quote summaries are cached only in the parent feature.
- Writes take at most two row locks (plan, then item).
- Revision content is read only for `list_revisions` and for consent checks, never for item commands.
- Pagination: list_by_booking uses keyset pagination with page limit 50.
- Connection pool: 20 per instance; statement timeout 2 s.

## Assumptions and open decisions
- A-MILESTONES-03: 50-item plan is the largest read case used for budgets.
- A-MILESTONES-10: Log retention 30 days; metrics 13 months as aggregates.
- Open: reference hardware and instance count are F15 decisions; the load targets above are proposals and are measured on the implementation's pilot environment before GO.
