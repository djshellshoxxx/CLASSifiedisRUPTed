# PS-040-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/01_rental_catalog/mod_deposits. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (log redaction, metrics classes), CTR-EVT-001 (event counts), CTR-COM-001 (claim latency and alerts), CTR-ERR-001.

**Decision labels:** Latency budgets are ASSUMPTION. D09 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-040-08.R01 | Every transition emits a counter `deposit_transitions_total{from,to}`. | MVP |
| PS-040-08.R02 | Command p95 ≤ 300 ms excluding claim service (ASSUMPTION). | MVP |
| PS-040-08.R03 | Release lag (HELD to RELEASED) is recorded as a histogram; p95 target ≤ 14 days (ASSUMPTION). | MVP |
| PS-040-08.R04 | Metric labels contain no amounts, party IDs or free text. | MVP |
| PS-040-08.R05 | Dashboards show counts and rates only; no per-party financial drill-down outside case scope. | MVP |

## Data / schema
Metric names: `deposit_transitions_total`, `deposit_invalid_transition_total`, `deposit_command_latency_ms`, `deposit_release_lag_days`, `deposit_dispute_rate`. Labels: `from`, `to`, `command`, `code`.

## Commands / queries / events
Each command records latency and outcome. Event count per aggregate is checked against `state_version` by a daily job.

## States & transitions
Counters per transition in PS-040-03. Invalid transition attempts are counted, not logged with payload.

## Validation & errors
`deposits_validation_reject_total{code}` from PS-040-02.

## Authorization
Metrics access follows CTR-PRV-001 operator rules; aggregated only.

## Failure, idempotency, concurrency, offline
Missing event for a `state_version` increment raises an integrity alert. Dashboards tolerate 5-minute delay.

## Privacy, retention, abuse
Metrics retained RET-OPS (30 days). Log lines are pseudonymous (CTR-PRV-001 R09).

## Observability & budgets
Alerts: any `RELEASED` without owner-attest event (must be 0); `DISPUTED` share per owner > 20% over 30 days (ASSUMPTION); command p95 > 300 ms for 10 min.

## Tests
- TEST-PS-040-08-01 (unit): each transition increments exactly one counter.
- TEST-PS-040-08-02 (lint): metric label set contains no forbidden keys.
- TEST-PS-040-08-03 (load): 200 concurrent proposals hold p95 ≤ 300 ms.
- TEST-PS-040-08-04 (alert): seeded RELEASED without attest fires alert.

## Acceptance criteria
1. All five metrics present and labelled as specified.
2. Load test meets R02 budget under fixture load.
3. Alert in TEST-PS-040-08-04 fires within 5 minutes.

## Assumptions & open decisions
- ASSUMPTION: latency and rate thresholds above.
- PROVISIONAL (D09 default, unapproved).
