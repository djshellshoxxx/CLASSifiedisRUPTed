# PS-042-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_handoff. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (metrics and log rules), CTR-EVT-001, CTR-ERR-001.

**Decision labels:** Budgets ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-042-08.R01 | Counter `rental_handoff_transitions_total{from,to}`. | MVP |
| PS-042-08.R02 | Attest command p95 ≤ 300 ms (ASSUMPTION). | MVP |
| PS-042-08.R03 | Histogram of schedule-to-COMPLETE time; p95 target ≤ 48 h. | MVP |
| PS-042-08.R04 | Labels exclude place, party IDs and checklist content. | MVP |

## Data / schema
Metrics: `rental_handoff_transitions_total`, `rental_handoff_command_latency_ms`, `rental_handoff_complete_seconds`, `rental_handoff_contest_total`.

## Commands / queries / events
Event count equals `state_version` (daily check).

## States & transitions
Counters per PS-042-03 transition.

## Validation & errors
`rental_handoff_validation_reject_total{code}`.

## Authorization
Aggregated metrics only.

## Failure, idempotency, concurrency, offline
Pending-queue age exported (PS-042-06).

## Privacy, retention, abuse
Metrics RET-OPS (30 days).

## Observability & budgets
Alerts: COMPLETE without both attestations (must be 0); expiry rate above 25% over 7 days (ASSUMPTION); pending queue p95 age above 1 h.

## Tests
- TEST-PS-042-08-01 (unit): one counter increment per transition.
- TEST-PS-042-08-02 (lint): forbidden label keys absent.
- TEST-PS-042-08-03 (load): 200 concurrent attests hold p95 ≤ 300 ms.
- TEST-PS-042-08-04 (alert): seeded one-sided COMPLETE fires alert.

## Acceptance criteria
1. All four metrics present with specified labels.
2. Load budget met.
3. Alert in -04 fires within 5 minutes.

## Assumptions & open decisions
- ASSUMPTION: thresholds above.
