# PS-100-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_risk. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-COM-001 (claim states), CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-100-03.R01 | Only the transitions in the table are reachable. Others → `RISK.TRANSITION_NOT_ALLOWED`. | MVP |
| PS-100-03.R02 | No transition blocks a consent, a payment claim, or a commitment. Risk outputs are holds on publication or visibility, step-up requests, or review routing. | MVP |
| PS-100-03.R03 | `hold_publication` hides a listing or auction from discovery until `cleared` or `escalated` resolves; the owner is told "under review". | MVP |
| PS-100-03.R04 | `step_up_pending` expires after 72 h (ASSUMPTION) and then the action remains blocked until review. | MVP |
| PS-100-03.R05 | An assessment reaches `expired` at `expires_at`; a new trigger creates a new assessment, never a re-tier of an expired one. | MVP |

## Data / schema
States: `assessed`, `review_required`, `step_up_pending`, `hold_publication`, `cleared`, `escalated`, `expired`. Stored in `rsk_assessment.state`.

## Commands / queries / events
See [PS-100-04](commands_queries_events.md).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `risk.assessed` | valid subject and model; tier computed | assessed | none |
| assessed | `risk.review_routed` | tier high or critical, or reason PAYMENT_CLAIM_MISMATCH | review_required | review queue item (case scope) |
| assessed | `risk.step_up_requested` | tier medium with account-level reason, and subject is `acc` | step_up_pending | F07 step-up request |
| assessed | `risk.hold_applied` | tier critical and subject is `lst`, `srv`, `rnt` or `auc` | hold_publication | hidden from discovery; owner notified generically |
| step_up_pending | `risk.cleared` | step-up verified (F07) | cleared | none |
| step_up_pending | `risk.expired` | 72 h elapsed without verification | expired | action remains limited; review routed |
| review_required, hold_publication | `risk.cleared` | reviewer decision with case ref | cleared | hold removed |
| review_required, hold_publication | `risk.escalated` | reviewer escalation to second reviewer | escalated | second review required |
| escalated | `risk.cleared` | second reviewer decision | cleared | hold removed |
| assessed, review_required, cleared | `risk.expired` | `expires_at` reached | expired | none |

## Validation & errors
Invalid transitions → `RISK.TRANSITION_NOT_ALLOWED`.

## Authorization
Automated `sys_` may create `assessed`, `review_routed`, `step_up_requested` and `hold_applied`. Clearing and escalation require reviewers (PS-100-05).

## Failure, idempotency, concurrency, offline
Hold and clearance are revision-checked; a clearance racing a new hold resolves to the higher revision.

## Privacy, retention, abuse
Owner sees only "under review" and time since hold; never tier or reasons.

## Observability & budgets
`risk_transition_total{from,to}`; `risk_hold_age_seconds` histogram.

## Tests
- `TEST-PS-100-03-01` unit: exhaustive state × event matrix.
- `TEST-PS-100-03-02` integration: a critical-tier listing hold removes it from discovery within one index refresh.
- `TEST-PS-100-03-03` integration: consent and claim flows proceed unchanged while a subject is on hold (no commitment blocked).
- `TEST-PS-100-03-04` integration: step-up expiry after 72 h routes to review.

## Acceptance criteria
1. Table is the sole source of transitions.
2. No test shows a risk transition blocking a consent or claim.
3. Holds are visible in operator queue within 60 s.

## Assumptions & open decisions
- ASSUMPTION: 72 h step-up window and 24 h hold review SLA are defaults for Trust&Safety review.
- D04 (partial barter execution), PROVISIONAL default: cycle assessments route to review and never remove consent or cancel a cycle (unapproved).
- D09 (rentals and deposits), PROVISIONAL default: holds never affect deposits or payment state (unapproved).
