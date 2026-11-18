# PS-020-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_three. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001 (R10), CTR-PRV-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-020-08.R01 | Metrics: `cycthree_proposed_total`, `cycthree_consented_total`, `cycthree_declined_total{slot_position}`, `cycthree_lock_recheck_failed_total`, `cycthree_consent_seconds` histogram. | MVP |
| PS-020-08.R02 | Funnel proposed → consented reported daily; alert below 25% over 7 days (ASSUMPTION). | MVP |
| PS-020-08.R03 | Consent p95 ≤ 300 ms server-side (ASSUMPTION). | MVP |
| PS-020-08.R04 | Logs carry cycle hash prefix and status only. | MVP |

## Data / schema
Labels: slot_position 0..2 only.

## Commands / queries / events
One timing sample per command.

## States & transitions
Counts per transition.

## Validation & errors
Counters by CYCTHREE code.

## Authorization
Aggregate dashboards only.

## Failure, idempotency, concurrency, offline
Metric loss tolerated.

## Privacy, retention, abuse
Metrics 30 days; logs redact pseudonyms.

## Observability & budgets
≤ 1 KB log per command; ≤ 15 series.

## Tests
- TEST-PS-020-08-01 (unit): counters per transition.
- TEST-PS-020-08-02 (load): consent p95 measured (not yet measured).
- TEST-PS-020-08-03 (negative): no pseudonyms in logs.

## Acceptance criteria
1. Metric names match list.
2. Targets ASSUMPTION until measured.
3. Zero pseudonyms in logs.

## Assumptions & open decisions
- ASSUMPTION: 25% funnel threshold.
