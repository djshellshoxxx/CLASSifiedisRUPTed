# PS-031-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_milestones. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-031-08.R01 | Metrics: `milestone_transition_total{from,to,result}`, `milestone_state_gauge{state}`, `milestone_claim_queue_depth`, `milestone_autoaccept_lag_seconds`. | MVP |
| PS-031-08.R02 | `milestone.submit` and `milestone.accept` p95 ≤ 300 ms server-side (ASSUMPTION). | MVP |
| PS-031-08.R03 | Auto-accept lag ≤ 5 min after the 7-day mark (ASSUMPTION). | MVP |
| PS-031-08.R04 | Alerts: claim queue item older than 1 h; any `EVT.REVISION_CONFLICT` spike > 2% of writes over 15 min. | MVP |
| PS-031-08.R05 | Logs carry IDs hashed, enum codes, latency; never amounts or text. | MVP |
| PS-031-08.R06 | Dashboards aggregate by state; cells < 5 suppressed. | MVP |

## Data / schema
Closed label sets: `from`, `to`, `state`, `result`. No amounts in labels.

## Commands / queries / events
Each command emits latency and result. Event append failure alerts.

## States & transitions
Gauge updated on each transition in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Counters per CTR-ERR-001 code.

## Authorization
Global operator dashboards with purpose (CTR-CAP-001 R06).

## Failure, idempotency, concurrency, offline
Metrics best-effort. Offline clients do not send timing.

## Privacy, retention, abuse
Telemetry retention 30 days (ASSUMPTION).

## Observability & budgets
| Budget | Target |
|---|---|
| Submit/accept p95 | ≤ 300 ms |
| Auto-accept lag | ≤ 5 min |
| Claim queue age | ≤ 1 h |

## Tests
- TEST-PS-031-08-01 unit: metric label closure.
- TEST-PS-031-08-02 log scan: no amounts or text.
- TEST-PS-031-08-03 integration: alert on injected queue age.

## Acceptance criteria
1. All metrics use closed label sets.
2. Log scan passes.
3. Alert rules configured before release (future gate).

## Assumptions & open decisions
- ASSUMPTION: latency and lag budgets.
- Payment checklist applies: no amount values in telemetry.
