# PS-019-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_party. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001 (R10), CTR-PRV-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-019-08.R01 | Metrics: `cycparty_bind_total{result}`, `cycparty_withdraw_total{phase}`, `cycparty_slot_taken_total`, `cycparty_bind_seconds` histogram. | MVP |
| PS-019-08.R02 | Bind p95 ≤ 150 ms server-side (ASSUMPTION). | MVP |
| PS-019-08.R03 | Alert if SLOT_TAKEN exceeds 1% of binds over 15 min (ASSUMPTION; possible abuse or client bug). | MVP |
| PS-019-08.R04 | Logs carry binding hash prefix and status only. | MVP |

## Data / schema
Labels limited to registry codes and phase names.

## Commands / queries / events
One timing sample per command.

## States & transitions
Counts per status.

## Validation & errors
Counters per CYCPARTY code.

## Authorization
Aggregate dashboards only.

## Failure, idempotency, concurrency, offline
Metric loss tolerated.

## Privacy, retention, abuse
Metrics 30 days; logs redact pseudonyms.

## Observability & budgets
≤ 1 KB log per command; ≤ 15 series.

## Tests
- TEST-PS-019-08-01 (unit): counters per result.
- TEST-PS-019-08-02 (load): bind p95 measured (not yet measured).
- TEST-PS-019-08-03 (negative): no pseudonyms in logs.

## Acceptance criteria
1. Metric names match list.
2. Latency targets are ASSUMPTION until measured.
3. Zero pseudonyms in logs.

## Assumptions & open decisions
- ASSUMPTION: 1% SLOT_TAKEN alert threshold.
