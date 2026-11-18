# PS-017-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_four. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001 (R10), CTR-PRV-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-017-08.R01 | Metrics: `cycfour_proposed_total`, `cycfour_consented_total`, `cycfour_superseded_total{reason}`, `cycfour_expired_total`, `cycfour_consent_seconds` histogram. | MVP |
| PS-017-08.R02 | Funnel: proposed → consented conversion reported daily; alert if below 20% over 7 days (ASSUMPTION). | MVP |
| PS-017-08.R03 | Consent command p95 ≤ 300 ms server-side (ASSUMPTION). | MVP |
| PS-017-08.R04 | Logs carry cycle hash prefix, version, status and timing only. | MVP |

## Data / schema
Histogram buckets 10 ms–5 s.

## Commands / queries / events
One timing sample per command.

## States & transitions
State counts emitted on each transition.

## Validation & errors
Counters keyed by CYCFOUR code.

## Authorization
Aggregate dashboards only.

## Failure, idempotency, concurrency, offline
Metric loss tolerated; events not.

## Privacy, retention, abuse
Metrics 30 days; logs redact pseudonyms.

## Observability & budgets
≤ 1 KB log per command; ≤ 25 series.

## Tests
- TEST-PS-017-08-01 (unit): counters per transition.
- TEST-PS-017-08-02 (load): consent p95 measured (not yet measured).
- TEST-PS-017-08-03 (negative): log scan finds no pseudonym refs.

## Acceptance criteria
1. Metric names match the list.
2. Latency targets stated as ASSUMPTION until measured.
3. Zero pseudonym refs in logs.

## Assumptions & open decisions
- ASSUMPTION: 20% funnel alert threshold.
- PENDING: reference profile (F15).
