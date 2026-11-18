# PS-037-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_fraud. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-037-08.R01 | Emit counters: `fraud_signals_recorded_total{rule_id}`, `fraud_cases_total{status}`, `fraud_eval_timeouts_total{rule_id}`. | MVP |
| PS-037-08.R02 | Rule evaluation p95 <= 200 ms per rule; bid event to signal p95 <= 60 s. | MVP |
| PS-037-08.R03 | Logs are structured JSON with `case_id` or `signal_id` prefix only; no account, bid, device or feature values. | MVP |
| PS-037-08.R04 | Time-to-first-claim p95 <= 24 h for OPEN cases (ASSUMPTION). | MVP |
| PS-037-08.R05 | Dashboards show aggregates only (k >= 5). | MVP |

## Data / schema
Metric labels limited to `rule_id`, `status`, `error_code`. No account-level labels.

## Commands / queries / events
Event `fraud.eval_slow` emitted when p95 breaches for 5 min; internal only.

## States & transitions
Not applicable.

## Validation & errors
Log redaction tests reject any log line containing a regex match for `acc_`, `bid_` or 64-hex strings followed by bounded length.

## Authorization
Dashboard access requires `fraud.read_aggregate` (PS-037-05).

## Failure, idempotency, concurrency, offline
Metrics are best-effort; missing samples never block fraud writes.

## Privacy, retention, abuse
Metric and log retention 30 days (ASSUMPTION). Traces sample at 1% and drop payload attributes.

## Observability & budgets
Budgets: 2,000 bid events/min per platform hot path (ASSUMPTION); write CPU <= 5% overhead on bid stream.

## Tests
- TEST-PS-037-08-01 (redaction): synthetic log with account and device values is redacted.
- TEST-PS-037-08-02 (performance): load fixture of 2,000 events/min meets R02.
- TEST-PS-037-08-03 (alert): DLQ > 0 for 15 min fires alert.

## Acceptance criteria
1. All counters present in staging.
2. Redaction test passes with zero leaks.
3. Load fixture meets p95 budgets.

## Assumptions & open decisions
- ASSUMPTION: 2,000 events/min is the planning budget.
- PROVISIONAL (D07 default, unapproved): 30-day telemetry retention.
