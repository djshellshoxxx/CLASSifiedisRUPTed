# PS-041-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_damage. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (log and metric rules), CTR-EVT-001 (event counts), CTR-COM-001 (alerts style), CTR-ERR-001.

**Decision labels:** Budgets are ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-041-08.R01 | Counter per transition: `damage_transitions_total{from,to}`. | MVP |
| PS-041-08.R02 | `damage_command_latency_ms` p95 ≤ 300 ms (ASSUMPTION). | MVP |
| PS-041-08.R03 | Time to first response (report to ACK or CONTEST) recorded as histogram; p50 reported, p95 target ≤ 72 h. | MVP |
| PS-041-08.R04 | Metric labels contain no amounts, descriptions or party IDs. | MVP |
| PS-041-08.R05 | Dashboards aggregate by category and outcome only. | MVP |

## Data / schema
Metrics: `damage_transitions_total`, `damage_escalations_total{reason}`, `damage_response_seconds`, `damage_command_latency_ms`, `damage_contest_rate` (per owner bucket, pseudonymous).

## Commands / queries / events
Event count per aggregate equals `state_version`; daily job alerts on gaps.

## States & transitions
Escalation reasons: TIMEOUT, NO_BASELINE, CONTESTED, DISPUTE.

## Validation & errors
`damage_validation_reject_total{code}`.

## Authorization
Metrics aggregated; no per-person drill-down outside case scope.

## Failure, idempotency, concurrency, offline
Timer job lag alert if > 15 min behind schedule.

## Privacy, retention, abuse
Metrics RET-OPS (30 days). Per-owner contest rate uses pseudonymous bucket IDs.

## Observability & budgets
Alerts: timer lag > 15 min; any RESOLVED total above held amount without claim record (must be 0); contest rate above 40% over 30 days for one owner bucket (ASSUMPTION).

## Tests
- TEST-PS-041-08-01 (unit): transition counter increments once.
- TEST-PS-041-08-02 (lint): forbidden label keys absent.
- TEST-PS-041-08-03 (load): 200 concurrent reports hold p95 ≤ 300 ms.
- TEST-PS-041-08-04 (alert): seeded timer lag fires alert.

## Acceptance criteria
1. All five metrics exist with specified labels.
2. Load budget met under fixture load.
3. Timer-lag alert fires within 5 minutes.

## Assumptions & open decisions
- ASSUMPTION: thresholds above.
- PROVISIONAL (D06 default, unapproved).
