# PS-129-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_management. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-129-03.R01 | Only the transitions in the table are permitted. Any other pair returns `MGMT.TRANSITION_INVALID`. | MVP |
| PS-129-03.R02 | At most one `active` policy per `key_class` at any instant. | MVP |
| PS-129-03.R03 | Activation occurs at `effective_from` by a `sys_` scheduler; late activation is allowed and flagged. | MVP |
| PS-129-03.R04 | A `deprecated` policy remains verifiable for 90 days (ASSUMPTION) before `retired`. | MVP |

## Data / schema
State is `status` on `crypto_policy` ([domain_schema.md](domain_schema.md)). Every transition writes one event (CTR-EVT-001 R02).

## Commands / queries / events
Transitions are triggered by commands in [commands_queries_events.md](commands_queries_events.md), except `activate` and `retire`, which are scheduler-driven.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| draft | propose | validation passes | proposed | emit `crypto_policy.proposed` |
| proposed | approve (1st) | approver ≠ proposer | proposed | emit `crypto_policy.approved` (count 1) |
| proposed | approve (2nd) | second distinct approver | scheduled | emit `crypto_policy.scheduled` |
| proposed | withdraw | proposer only | draft | emit `crypto_policy.cancelled` |
| scheduled | activate | `effective_from` reached; no overlap | active | previous active → deprecated; emit `crypto_policy.activated` |
| scheduled | cancel | operator, purpose recorded | cancelled | emit `crypto_policy.cancelled` |
| active | deprecate | operator, purpose recorded | deprecated | emit `crypto_policy.deprecated` |
| deprecated | retire | 90-day window elapsed | retired | emit `crypto_policy.retired` |

`cancelled` and `retired` are terminal. A cancelled policy is not reopened; a new draft is created.

## Validation & errors
Invalid transition: `MGMT.TRANSITION_INVALID` (conflict, 409, not retryable).

## Authorization
Guards reference [authorization_capabilities.md](authorization_capabilities.md). Scheduler actor is `sys_`.

## Failure, idempotency, concurrency, offline
Each transition is applied under the policy record lock with `expected_revision`. Activation job is idempotent on (`policy_id`, `effective_from`). Missed activation runs on the next tick with `late = true`.

## Privacy, retention, abuse
State history is governance data (PUBLIC). No personal data is added by transitions.

## Observability & budgets
Alert if any `key_class` has zero `active` policy for more than 5 minutes after an `effective_from` boundary.

## Tests
- TEST-PS-129-03-01: unit, every row of the table and every invalid pair.
- TEST-PS-129-03-02: property, random transition sequences never yield two active policies per key class.

## Acceptance criteria
1. 100% of permitted transitions emit exactly one event with the correct type.
2. Replay of an activation produces no second active record.
3. Terminal states reject all further commands.

## Assumptions & open decisions
- ASSUMPTION: 90-day deprecation window.
- D10 (rotation and recovery): PROVISIONAL (D10 default, unapproved).
