# PS-043-08 — observability and performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/02_rental_lifecycle/mod_return. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-EVT-001, CTR-ERR-001.

**Decision labels:** Budgets ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-043-08.R01 | `return_transitions_total{from,to}` per transition. | MVP |
| PS-043-08.R02 | `return.declare` p95 ≤ 300 ms (ASSUMPTION). | MVP |
| PS-043-08.R03 | Histogram of `late_minutes` buckets (0, 1–60, 61–1440, >1440) without per-person labels. | MVP |
| PS-043-08.R04 | No person-level labels. | MVP |

## Data / schema
Metrics: `return_transitions_total`, `return_command_latency_ms`, `return_late_bucket_total{bucket}`, `return_owner_window_closed_total`.

## Commands / queries / events
Event count equals `state_version` (daily check).

## States & transitions
Counters per PS-043-03 transition.

## Validation & errors
`return_validation_reject_total{code}`.

## Authorization
Aggregated metrics only.

## Failure, idempotency, concurrency, offline
Timer lag per PS-043-06.

## Privacy, retention, abuse
Metrics RET-OPS (30 days).

## Observability & budgets
Alerts: owner-window closures > 30% over 30 days (ASSUMPTION); timer lag > 15 min; CLOSED without deposit request event (must be 0).

## Tests
- TEST-PS-043-08-01 (unit): one counter per transition.
- TEST-PS-043-08-02 (lint): no person-level label.
- TEST-PS-043-08-03 (load): 200 concurrent declarations hold p95 ≤ 300 ms.
- TEST-PS-043-08-04 (alert): seeded CLOSED without request fires alert.

## Acceptance criteria
1. Metrics exist with specified labels.
2. Load budget met.
3. Alert fires within 5 minutes.

## Assumptions & open decisions
- ASSUMPTION: thresholds above.
