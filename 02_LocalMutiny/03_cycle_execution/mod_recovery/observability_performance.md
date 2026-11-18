# PS-024-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_recovery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001 (R10), CTR-PRV-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-024-08.R01 | Metrics: `cycrecov_opened_total{trigger}`, `cycrecov_closed_total{status}`, `cycrecov_escalated_total`, `cycrecov_open_seconds` histogram. | MVP |
| PS-024-08.R02 | Alert if escalations exceed 10% of opens over 7 days (ASSUMPTION). | MVP |
| PS-024-08.R03 | Compensation step failures counted per step type. | MVP |
| PS-024-08.R04 | Logs carry recovery hash prefix, state and timing only. | MVP |

## Data / schema
Label values from enums only.

## Commands / queries / events
One sample per command.

## States & transitions
Time-in-state histogram.

## Validation & errors
Counters by CYCRECOV code.

## Authorization
Aggregate dashboards only.

## Failure, idempotency, concurrency, offline
Metric loss tolerated.

## Privacy, retention, abuse
Metrics 30 days; logs redact refs.

## Observability & budgets
≤ 1 KB log per command.

## Tests
- TEST-PS-024-08-01 (unit): counters per state change.
- TEST-PS-024-08-02 (load): attest p95 measured (not yet measured).
- TEST-PS-024-08-03 (negative): no refs in logs.

## Acceptance criteria
1. Metric names match list.
2. Targets ASSUMPTION until measured.
3. Zero refs in logs.

## Assumptions & open decisions
- ASSUMPTION: 10% escalation alert.
