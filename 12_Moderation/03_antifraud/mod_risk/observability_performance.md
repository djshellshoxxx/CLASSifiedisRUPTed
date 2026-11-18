# PS-100-08 — observability performance

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_risk. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R10), CTR-PRV-001 (R09), CTR-EVT-001 (R04).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-100-08.R01 | Metrics carry no `rsk_id`, `acc_`, `lst_` or feature labels. Tier and category codes are allowed. | MVP |
| PS-100-08.R02 | Assessment completes p95 ≤ 500 ms after trigger. | MVP |
| PS-100-08.R03 | Pending-assessment flag clears or auto-routes within 15 min for 100 % of items (p100). | MVP |
| PS-100-08.R04 | Fairness metrics (tier distribution by locale and region cell) published monthly with K_MIN. | MVP |

## Data / schema
| Metric | Type | Labels |
|---|---|---|
| `risk_assessed_total` | counter | `subject_type`, `tier` |
| `risk_transition_total` | counter | `from`, `to` |
| `risk_queue_age_seconds` | gauge | `subject_type` |
| `risk_hold_age_seconds` | histogram | `subject_type` |
| `risk_fairness_tier_share` | gauge | `locale`, `tier` (cells suppressed below K_MIN) |

## Commands / queries / events
Span `risk.assess` with tier bucket and category codes only.

## States & transitions
Dashboards: holds open per subject type; review backlog.

## Validation & errors
`risk_validation_error_total{code}`.

## Authorization
Dashboards: `ope_` aggregate scope.

## Failure, idempotency, concurrency, offline
Alerts: queue age > 15 min (page); hold age > 24 h without review (ticket); fairness share shift > 5 points (ticket).

## Privacy, retention, abuse
No subject labels; fairness aggregates suppressed below K_MIN = 5 (CTR-PRV-001 R04).

## Observability & budgets
Capacity: 500 assessments per second per node (ASSUMPTION). Storage ≤ 1 KB per assessment.

## Tests
- `TEST-PS-100-08-01` load: 500 assessments/s for 10 min meet R02.
- `TEST-PS-100-08-02` contract: label set check.
- `TEST-PS-100-08-03` alert: forced queue stall pages within 15 min.
- `TEST-PS-100-08-04` privacy: fairness aggregate below K_MIN not published.

## Acceptance criteria
1. Metrics and alerts documented and tested.
2. Latency and pending-flag budgets met.
3. K_MIN suppression verified.

## Assumptions & open decisions
- ASSUMPTION: capacity values are reference-node estimates.
- D07 (retention), PROVISIONAL default applies to metrics (unapproved).
