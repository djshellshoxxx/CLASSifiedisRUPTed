# PS-025-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_currency. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001 (R10), CTR-PRV-001 (R09), CTR-COM-001 (R04).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-025-08.R01 | Metrics: `cyccurr_pin_total{result}`, `cyccurr_quote_blocked_total{code}`, `cyccurr_expired_before_lock_total`, `cyccurr_pin_seconds` histogram. | MVP |
| PS-025-08.R02 | Pin p95 ≤ 200 ms server-side (ASSUMPTION). | MVP |
| PS-025-08.R03 | Alert when quote-blocked consents exceed 15% over 1 h (ASSUMPTION; possible quote-owner fault). | MVP |
| PS-025-08.R04 | Logs carry binding hash prefix and code only; never amounts or quote values. | MVP |

## Data / schema
Labels from enums only.

## Commands / queries / events
One sample per pin.

## States & transitions
Counts per state.

## Validation & errors
Counters by CYCCURR code.

## Authorization
Aggregate dashboards only.

## Failure, idempotency, concurrency, offline
Metric loss tolerated.

## Privacy, retention, abuse
Metrics 30 days; logs redact values.

## Observability & budgets
≤ 1 KB log per pin.

## Tests
- TEST-PS-025-08-01 (unit): counters per result.
- TEST-PS-025-08-02 (load): pin p95 measured (not yet measured).
- TEST-PS-025-08-03 (negative): log scan finds no amounts.

## Acceptance criteria
1. Metric names match list.
2. Targets ASSUMPTION until measured.
3. Zero amounts in logs or metrics.

## Assumptions & open decisions
- ASSUMPTION: 15% alert threshold.
