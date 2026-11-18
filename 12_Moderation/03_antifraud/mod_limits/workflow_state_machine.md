# PS-098-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_limits. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02), CTR-SCH-001 (migration on policy schema), CTR-CAP-001 (R07 dual control).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-098-03.R01 | Only the transitions in the table are reachable. Others → `LIMITS.TRANSITION_NOT_ALLOWED`. | MVP |
| PS-098-03.R02 | Activation of a policy retires the previous active policy for the same (`quota_key`, `scope`, `jurisdiction`) in the same transaction. | MVP |
| PS-098-03.R03 | Rollout: a new policy starts at `rollout_percent` 5, then 25, then 100 by explicit steps, each at least 24 h apart (ASSUMPTION). | MVP |
| PS-098-03.R04 | Retired policies are read-only and kept for decision reproduction. | MVP |
| PS-098-03.R05 | A policy can be tightened only after its rollout reaches 100 %, except when `rationale_code` = ABUSE_PATTERN, which may go straight to 100 % with dual control. | MVP |

## Data / schema
States: `draft`, `active`, `retired`. `rollout_percent` ∈ {5, 25, 100} while `active`. Stored in `lim_policy`.

## Commands / queries / events
See [PS-098-04](commands_queries_events.md).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | `limits.policy_drafted` | valid body (PS-098-02) | draft | none |
| draft | `limits.policy_activated` | approver ≠ creator; rollout 5 % | active | previous active → retired |
| active (rollout 5) | `limits.rollout_advanced` | ≥ 24 h, approver | active (rollout 25) | none |
| active (rollout 25) | `limits.rollout_advanced` | ≥ 24 h, approver | active (rollout 100) | none |
| active | `limits.policy_retired` | superseded by activation, or operator retirement with reason | retired | none (decisions keep the version) |
| draft | `limits.policy_withdrawn` | creator or operator | retired | none |

Rollout to 100 % is a separate event type: `limits.rollout_advanced` (same type, `to_percent` payload).

## Validation & errors
Invalid transitions → `LIMITS.TRANSITION_NOT_ALLOWED`. Tightening before 100 % → `LIMITS.TRANSITION_NOT_ALLOWED` with `details.rule = rollout_incomplete`.

## Authorization
Per [PS-098-05](authorization_capabilities.md). No automated actor may activate or advance rollout.

## Failure, idempotency, concurrency, offline
Concurrent activations for the same key: unique active constraint plus revision check; loser gets `EVT.REVISION_CONFLICT`.

## Privacy, retention, abuse
Policy history is internal; policy values are published in aggregate form only (ASSUMPTION).

## Observability & budgets
`limits_transition_total{from,to}`; gauge `limits_active_policies`.

## Tests
- `TEST-PS-098-03-01` unit: exhaustive state × event matrix.
- `TEST-PS-098-03-02` integration: activation retires predecessor atomically (no window with two active).
- `TEST-PS-098-03-03` integration: rollout cannot skip 25 %.
- `TEST-PS-098-03-04` integration: ABUSE_PATTERN tightening goes to 100 % only with dual control.

## Acceptance criteria
1. At most one active policy per key/scope/jurisdiction at all times (property test).
2. Rollout steps enforced in code and test.
3. Retired policies still reproduce past decisions.

## Assumptions & open decisions
- ASSUMPTION: 5 / 25 / 100 rollout steps with 24 h spacing are defaults.
- D02 (cycle optimizer), not applicable; listed because barter proposal limits use the same rollout mechanism.
