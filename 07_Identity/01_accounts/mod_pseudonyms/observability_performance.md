# PS-052-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_pseudonyms. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (diagnostics), CTR-EVT-001 (lag metrics), CTR-PRV-001 (log classes), CTR-CAP-001 R08 (audit).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-052-08.R01 | Every command emits counter, latency histogram and error-code counter. | MVP |
| PS-052-08.R02 | Command p95 ≤ 300 ms; query p95 ≤ 100 ms; handle availability check p95 ≤ 50 ms (server-side). | MVP |
| PS-052-08.R03 | Logs contain `prf_id`, `event_id`, command and code only. No handle, label, `account_id` in application logs. | MVP |
| PS-052-08.R04 | Metric labels never include `prf_id`, handle, label or `acc_` (cardinality and linkage). | MVP |
| PS-052-08.R05 | Abuse alerts on rate of `HAS_OPEN_PARTICIPATION`, `HANDLE_TAKEN` and rate-limit hits, aggregated per minute. | MVP |
| PS-052-08.R06 | Accessibility budget: error messages announced by screen readers in the web and mobile clients (tested in mod_keyboard / mod_screenreader). | MVP |

## Data / schema
Metric names and label sets:

| Metric | Type | Labels |
|---|---|---|
| `pseud_cmd_total` | counter | `command`, `result` |
| `pseud_cmd_latency_ms` | histogram | `command` |
| `pseud_validation_fail_total` | counter | `code` |
| `pseud_outbox_lag_seconds` | gauge | none |
| `pseud_queue_not_applied_total` | counter | `code` |
| `pseud_authz_deny_total` | counter | `action` |

## Commands / queries / events
Latency and error reporting apply to all commands in [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Transition counters per [workflow_state_machine.md](workflow_state_machine.md): `pseud_transition_total{from,to,event}`.

## Validation & errors
Error counters by `code` only (CTR-ERR-001). Unknown codes count as `SYS.INTERNAL`.

## Authorization
Dashboards viewable by F16 and F07 operators only; no per-handle views.

## Failure, idempotency, concurrency, offline
Client-side offline queue depth reported as aggregate only (no per-user identifiers).

## Privacy, retention, abuse
Operational logs (pseudonymous) retained 30 days (RET-OPS). Metric retention 13 months, aggregated. Audit (`aud_`) retention 12 months (RET-AUD).

## Observability & budgets
- Budgets: command p95 300 ms; outbox lag p95 ≤ 5 s; availability target 99.9% monthly (ASSUMPTION).
- Load target: 50 creates/s peak with 1 M `prf_` rows (ASSUMPTION, to validate in PS-052-09).
- Alert thresholds: `HANDLE_TAKEN` > 20% of claims over 15 min (possible squatting campaign).

## Tests
- TEST-PS-052-08-01 (unit): each command increments counter exactly once.
- TEST-PS-052-08-02 (privacy scan): log and metric output contains no handle, label, `prf_` or `acc_` strings in fixture run.
- TEST-PS-052-08-03 (load): 50 creates/s for 10 min meets p95 budget.
- TEST-PS-052-08-04 (a11y): error announcements present for each code in web client.

## Acceptance criteria
1. Dashboards and alerts exist for each listed metric.
2. Log and metric redaction verified by fixture scan.
3. Latency budgets met under the load test.
4. No per-user dimension in any metric.

## Assumptions & open decisions
- ASSUMPTION: 99.9% monthly availability target.
- ASSUMPTION: 50 creates/s peak load, 1 M rows.
- PROVISIONAL (D07 default, unapproved): operational log retention 30 days.
