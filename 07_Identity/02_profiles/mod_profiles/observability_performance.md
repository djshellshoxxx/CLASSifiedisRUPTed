# PS-056-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/02_profiles/mod_profiles. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (diagnostics), CTR-EVT-001 (lag), CTR-PRV-001 (log classes; K_MIN), CTR-CAP-001 R08 (audit).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-056-08.R01 | Each command, query and purge job emits counter and latency histogram. | MVP |
| PS-056-08.R02 | `GetPublicProfile` p95 ≤ 100 ms; `UpdateProfile` p95 ≤ 300 ms; `GetCounterpartyView` p95 ≤ 150 ms (server-side). | MVP |
| PS-056-08.R03 | Logs contain `prf_id`, command and code only; no bio, languages, region or contact values. | MVP |
| PS-056-08.R04 | Metric labels exclude `prf_id`, region and any profile value. | MVP |
| PS-056-08.R05 | Alert when contact-pattern rejections exceed 5% of profile writes over 1 h (possible spam wave). | MVP |
| PS-056-08.R06 | Profile editor and counterparty view meet WCAG 2.1 AA (F14). | MVP |

## Data / schema
| Metric | Type | Labels |
|---|---|---|
| `prof_cmd_total` | counter | `command`, `result` |
| `prof_cmd_latency_ms` | histogram | `command` |
| `prof_validation_fail_total` | counter | `code` |
| `prof_purge_total` | counter | `result` |
| `prof_outbox_lag_seconds` | gauge | none |
| `prof_authz_deny_total` | counter | `action` |

## Commands / queries / events
Covers all commands in [commands_queries_events.md](commands_queries_events.md).

## States & transitions
`prof_transition_total{from,to}` per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Error counters by code only.

## Authorization
Dashboards for F07 and F16 operators; no per-profile views.

## Failure, idempotency, concurrency, offline
Device queue depth reported as aggregate, not per user.

## Privacy, retention, abuse
Operational logs 30 days (RET-OPS); metrics 13 months aggregated; audit 12 months (RET-AUD).

## Observability & budgets
- Availability 99.9% monthly (ASSUMPTION).
- Load: 200 public reads/s and 10 writes/s peak with 1 M profiles (ASSUMPTION).
- Purge job completes daily batch within 1 h for 100 k due rows (ASSUMPTION).

## Tests
- TEST-PS-056-08-01 (unit): each command increments counter once.
- TEST-PS-056-08-02 (privacy scan): log and metric output has no profile values.
- TEST-PS-056-08-03 (load): 200 reads/s for 10 min within budget.
- TEST-PS-056-08-04 (a11y): editor and counterparty view pass automated checks.

## Acceptance criteria
1. Dashboards and alerts exist for each listed metric.
2. Redaction verified by fixture scan.
3. Latency budgets met under load.
4. No profile value in any metric label.

## Assumptions & open decisions
- ASSUMPTION: load and availability targets above.
- PROVISIONAL (D07 default, unapproved): log retention 30 days.
