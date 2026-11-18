# PS-069-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_noncustodial (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R09 log pseudonymity), CTR-ERR-001 (R10 log content), CTR-CAP-001 (R08 audit). **Decisions:** D09 (PROVISIONAL default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-069-08.R01 | Emit metrics for each command: count, error count by code, p50, p95, p99 latency. | MVP |
| PS-069-08.R02 | Alert on any `COM.CUSTODY_FORBIDDEN` in production within 5 min (attempted custody bypass). | MVP |
| PS-069-08.R03 | Alert when `NONCUST.RAIL_UNAVAILABLE` rate exceeds 5% for any adapter over 10 min. | MVP |
| PS-069-08.R04 | Dashboards show routes per status and adapter status; no per-party breakdown. | MVP |
| PS-069-08.R05 | Traces carry `route_id` and command name; no destination or hint values (PS-069-07 R05). | MVP |

## Data / schema
Metric labels limited to: `command`, `code`, `adapter_id`, `rail`, `status`. No `acc_`, `destination` or `contact_hint` label values.

## Commands / queries / events
Event `route.*` counts are derived from the event log; no separate event for metrics.

## States & transitions
Not applicable (observability only).

## Validation & errors
Error codes logged as enums; messages are never logged (CTR-ERR-001 R10).

## Authorization
Dashboard access requires `ope_` role with read-only grant; no `contact_hint`.

## Failure, idempotency, concurrency, offline
Metrics emission is async; loss of metrics does not block commands. Offline client telemetry is batched and stripped of IDs other than a per-device hash.

## Privacy, retention, abuse
Logs retained RET-OPS (30 days). Trace retention 7 days (ASSUMPTION).

## Observability & budgets
| Budget | Target |
|---|---|
| `route.declare` server p95 | ≤ 300 ms |
| `route.list` p95 (≤ 5 routes) | ≤ 200 ms |
| Adapter validation call p95 | ≤ 500 ms |
| Metrics ingestion lag | ≤ 60 s |

## Tests
- TEST-PS-069-08-01 (integration): latency histograms emitted for each command.
- TEST-PS-069-08-02 (negative): custody-forbidden event triggers alert within 5 min in staging drill.
- TEST-PS-069-08-03 (negative): log and trace canary scan returns zero matches.
- TEST-PS-069-08-04 (load): 200 declares per second for 10 min meets p95 budget.

## Acceptance criteria
1. Each budget row is measured in staging before any production release (later phase).
2. Canary scan of logs, traces and metrics labels is clean.
3. Alert routing for R02 and R03 is documented in the on-call runbook (later phase).

## Assumptions & open decisions
- ASSUMPTION: 7-day trace retention.
- ASSUMPTION: 200 declares per second is above expected MVP peak.
- D09 (PROVISIONAL default, unapproved).
