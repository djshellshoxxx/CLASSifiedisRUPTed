# PS-053-08 — observability and performance
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_recovery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-053-08.R01 | Metrics: `recovery_requests_total{method,outcome}`, `recovery_proof_failures_total`, `recovery_locks_total`, `recovery_cooldown_cancellations_total`, `recovery_completions_total`. | MVP |
| PS-053-08.R02 | Latency p95: `start` ≤ 400 ms (excluding provider), `submit_proof` ≤ 300 ms, `complete` ≤ 250 ms. | MVP |
| PS-053-08.R03 | Argon2id parameters: memory 64 MiB, iterations 3, parallelism 1 (ASSUMPTION; RFC 9106 second recommended option). Verify p95 ≤ 250 ms. | MVP |
| PS-053-08.R04 | Logs redacted: no code, OTP, contact address or raw IP. Log fields: `rec_` ID, state, method, code. | MVP |
| PS-053-08.R05 | Alert: `recovery_locks_total` > 3× 7-day baseline; any completion within 72 h of contact change. | MVP |

## Data / schema
Metrics use bounded label sets only; no account ID as label.

## Commands / queries / events
Dashboards read event stream counts; no payload reads.

## States & transitions
Transition counts per [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Rejection counts by code per [validation_rules](validation_rules.md).

## Authorization
Dashboard access limited to F07 operators; no per-account drilldown without case grant.

## Failure, idempotency, concurrency, offline
Metric emission failure never blocks a command.

## Privacy, retention, abuse
Metric retention 90 days; log retention RET-OPS.

## Observability & budgets
Budget: ≤ 2 KiB log volume per request. Trace sampling 10% except errors (100%).

## Tests
TEST-PS-053-18 (metric emission on each transition), TEST-PS-053-19 (latency under load: 200 req/s, p95 targets), TEST-PS-053-20 (redaction scan).

## Acceptance criteria
1. Latency targets met in the load test.
2. Redaction scan finds no secret or contact string.

## Assumptions & open decisions
- ASSUMPTION: latency and alert thresholds.
- PROVISIONAL (D07 default, unapproved): metric and log retention.
