# PS-046-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/03_ranking/mod_fairness. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision), CTR-CAP-001 (approvals).

**Decision labels:** Dual approval ASSUMPTION. Other labels per CTR-CAP-001 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-046-03.R01 | Policy status set exactly DRAFT, ACTIVE, RETIRED. RETIRED is terminal. | MVP |
| PS-046-03.R02 | Activation requires two distinct approvers recorded before the transition. | MVP |
| PS-046-03.R03 | Activating a new policy for a scope retires the previous ACTIVE policy in the same transaction. | MVP |
| PS-046-03.R04 | A policy that fails validation cannot leave DRAFT. | MVP |
| PS-046-03.R05 | Other transitions → `FAIRNESS.INVALID_TRANSITION` (409). | MVP |

## Data / schema
Each transition increments `state_version`; policy versions immutable once ACTIVE.

## Commands / queries / events
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | rank_policy.drafted | PS-046-02 pass | DRAFT | None |
| DRAFT | rank_policy.activated | two approvers; no conflict | ACTIVE | Previous ACTIVE → RETIRED |
| ACTIVE | rank_policy.retired | replaced or emergency retire by dual approval | RETIRED | Revert to prior policy only by new draft |

## States & transitions
Terminal: RETIRED.

## Validation & errors
`FAIRNESS.INVALID_TRANSITION` (409), `FAIRNESS.APPROVAL_MISSING` (422).

## Authorization
Approvers: `ope` or F06 lead roles with distinct identities; cannot approve own draft (CAP.SELF_APPROVAL_FORBIDDEN).

## Failure, idempotency, concurrency, offline
Activation is a single transaction; concurrent activations for one scope: one wins (`FAIRNESS.POLICY_CONFLICT`).

## Privacy, retention, abuse
Policy history retained indefinitely as configuration (no personal data).

## Observability & budgets
`rank_policy_transitions_total{from,to}`; alert if two ACTIVE policies exist for one scope (must be 0).

## Tests
- TEST-PS-046-03-01 (state): every table row passes.
- TEST-PS-046-03-02 (approval): one approver → activation rejected.
- TEST-PS-046-03-03 (race): two simultaneous activations → one ACTIVE.
- TEST-PS-046-03-04 (retire): activation retires prior ACTIVE in same commit.

## Acceptance criteria
1. Never two ACTIVE policies per scope (TEST-PS-046-03-03).
2. No activation without two approvers.
3. Prior policy versions retrievable for audit.

## Assumptions & open decisions
- ASSUMPTION: two approvers for activation.
