# PS-104-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_push. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-PRV-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-104-08.R01 | Dispatch-to-provider-acceptance p95 ≤ 1.5 s; p99 ≤ 5 s, excluding provider-side delay. | MVP |
| PS-104-08.R02 | Queue lag (`scheduled_at` to send) p95 ≤ 30 s under normal load. | MVP |
| PS-104-08.R03 | Dispatcher sustains 500 sends/s per node (ASSUMPTION) with ≤ 1% CPU overhead per 100 sends/s. | MVP |
| PS-104-08.R04 | Alert when provider 5xx ratio > 5% for 5 min, or circuit open > 10 min. | MVP |
| PS-104-08.R05 | Logs are redacted per CTR-ERR-001 R10 and PS-104-07.R03. | MVP |

## Data / schema
Metrics (labels are bounded enums only):
- `push_dispatch_seconds` histogram, labels `outcome`.
- `push_attempts_total{status,http_class}`.
- `push_subscriptions{status}` gauge.
- `push_circuit_state{host}`.
- `push_queue_lag_seconds` histogram.

No label contains an account ID, endpoint or `ntf_id`.

## Commands / queries / events
Each command and dispatch run emits a trace span with `request_id` and `correlation_id` (CTR-EVT-001 R09). Span attributes exclude endpoint.

## States & transitions
Gauges reflect state from [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Validation failure counts by `code` only.

## Authorization
Dashboards are restricted to operators with `global` scope and no PRIVATE access (CTR-CAP-001 R04).

## Failure, idempotency, concurrency, offline
Alert on duplicate-attempt detection (same key twice). Dashboards show retry counts.

## Privacy, retention, abuse
Metrics retention RET-OPS 30 days. Traces retention 7 days (ASSUMPTION). No personal identifiers in metrics.

## Observability & budgets
- Budget: registration command p95 ≤ 300 ms; revocation p95 ≤ 300 ms.
- Budget: dispatch memory ≤ 256 MB per worker (ASSUMPTION).
- Synthetic probe: one test subscription per region every 5 min, against a test push host.

## Tests
- TEST-PS-104-08-01 (integration): latency histogram populated for 1000 simulated sends; p95 within R01 budget in load environment.
- TEST-PS-104-08-02 (unit): metric label cardinality check rejects labels named `account_id`, `endpoint` or `ntf_id`.
- TEST-PS-104-08-03 (integration): synthetic probe failure raises alert within 10 min.
- TEST-PS-104-08-04 (load): 500 sends/s sustained for 15 min without queue lag above 30 s.

## Acceptance criteria
1. Each metric in the Data section exists and is documented.
2. Cardinality test passes.
3. Load test meets R03 before MVP gate (not claimed as passed).

## Assumptions & open decisions
- ASSUMPTION: throughput and memory budgets.
- No Dxx applies directly.
