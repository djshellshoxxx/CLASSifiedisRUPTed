# PS-047-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/03_ranking/mod_relevance. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision), CTR-CAP-001 (approvals).

**Decision labels:** Shadow period 7 days ASSUMPTION. Dual approval ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-047-03.R01 | Model status set exactly DRAFT, SHADOW, ACTIVE, RETIRED. | MVP |
| PS-047-03.R02 | A SHADOW model is computed on live candidates but never served; shadow results are compared with ACTIVE results for 7 days (ASSUMPTION) before activation is allowed. | MVP |
| PS-047-03.R03 | Activation retires the previous ACTIVE model for the same scope in the same transaction. | MVP |
| PS-047-03.R04 | RETIRED is terminal; rollback creates a new DRAFT from a retired model's values. | MVP |
| PS-047-03.R05 | Other transitions → `RELEV.INVALID_TRANSITION` (409). | MVP |

## Data / schema
`state_version` increments per transition; activated versions immutable.

## Commands / queries / events
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | ranking_model.drafted | PS-047-02 pass | DRAFT | None |
| DRAFT | ranking_model.shadowed | validation pass | SHADOW | Shadow computation starts |
| SHADOW | ranking_model.activated | 7-day comparison recorded; two approvers | ACTIVE | Previous ACTIVE → RETIRED |
| ACTIVE, SHADOW | ranking_model.retired | replaced, or dual-approved stop | RETIRED | Serving falls back to prior ACTIVE if any |

## States & transitions
Terminal: RETIRED.

## Validation & errors
`RELEV.INVALID_TRANSITION` (409); `RELEV.APPROVAL_MISSING` (422).

## Authorization
Two distinct approvers; drafter cannot approve (CAP.SELF_APPROVAL_FORBIDDEN).

## Failure, idempotency, concurrency, offline
Activation transaction; concurrent activations → one wins. Shadow job idempotent per `(model_id, day)`.

## Privacy, retention, abuse
Shadow comparison stores aggregate metrics only.

## Observability & budgets
`ranking_model_transitions_total{from,to}`; alert if two ACTIVE models exist in one scope (must be 0).

## Tests
- TEST-PS-047-03-01 (state): every table row passes.
- TEST-PS-047-03-02 (shadow): activation without 7-day comparison rejected.
- TEST-PS-047-03-03 (race): simultaneous activations → one ACTIVE.
- TEST-PS-047-03-04 (rollback): retired model values produce new DRAFT, not reactivation.

## Acceptance criteria
1. No activation without shadow comparison (TEST-PS-047-03-02).
2. Never two ACTIVE models per scope.
3. Retired models immutable.

## Assumptions & open decisions
- ASSUMPTION: 7-day shadow window.
- OPEN (F06): shadow metric definitions.
