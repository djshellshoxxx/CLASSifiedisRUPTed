# PS-053-03 — workflow state machine
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_recovery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-053-03.R01 | Exactly six request states: requested, verified, completed, cancelled, expired, locked. Terminal: completed, cancelled, expired. | MVP |
| PS-053-03.R02 | No transition to `completed` before `cooldown_ends_at`. Enforced in the command handler, not by the scheduler. | MVP |
| PS-053-03.R03 | Owner cancel is allowed in `requested`, `verified` and `locked`. Cancel does not revoke sessions. | MVP |
| PS-053-03.R04 | Every transition emits one CTR-EVT-001 event with `revision` + 1. | MVP |
| PS-053-03.R05 | Timers (expiry, lock release) are checked at command time; a late scheduler run never extends a deadline. | MVP |

## Data / schema
Revision per `rec_` (CTR-EVT-001 R02). State is stored on the `rec_` row only.

## Commands / queries / events
Transitions are triggered by commands in [commands_queries_events](commands_queries_events.md).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | start | account active or unknown (generic response); method enrolled; ≤ 1 open request | requested | OTP sent if `verified_contact`; event `recovery_request.started`; owner sessions and verified contacts notified (generic text). |
| requested | proof_ok | proof matches; `now ≤ expires_at`; not locked | verified | `cooldown_ends_at` = now + 24 h; events `proof_accepted`, `cooldown_started`; notify all verified contacts and sessions. |
| requested | proof_bad | attempt_count < 4 | requested | attempt_count + 1; event `proof_rejected`. |
| requested | proof_bad | attempt_count = 4 | locked | lock_until = now + 60 min; event `locked`; OTP hash purged. |
| requested | timer | now > expires_at | expired | OTP purged; event `expired`. |
| locked | timer | now ≥ lock_until | expired | Forces a new request. Event `expired`. |
| verified | complete | now ≥ cooldown_ends_at; no cancel received | completed | Rotate credential; revoke all sessions except new one; event `completed`. |
| requested, verified, locked | cancel | caller is owner session or holds valid method proof | cancelled | event `cancelled`; notify contacts. |

## Validation & errors
Invalid transitions return `MOD_RECOVERY.INVALID_STATE`. Guard failures map to `COOLDOWN_ACTIVE`, `REQUEST_EXPIRED` or `LOCKED` (see [validation_rules](validation_rules.md)).

## Authorization
Transition authority per [authorization_capabilities](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Transitions are applied under a row lock with `expected_revision`. Outbox row written in the same transaction as the state change.

## Privacy, retention, abuse
Terminal rows keep state and timestamps only (no OTP, contact or code).

## Observability & budgets
`recovery_transitions_total{from,to}`; `cooldown_cancellations_total` is a takeover-signal metric.

## Tests
TEST-PS-053-05 (every row of the table), TEST-PS-053-06 (property: no `completed` before cooldown across random interleavings).

## Acceptance criteria
1. Each table row has a passing test.
2. Property test runs 10 000 sequences with zero violations of R02.

## Assumptions & open decisions
- ASSUMPTION: 24 h cooldown, 60 min lock after 5 failed attempts (attempt_count = 5).
- PROVISIONAL (D10 default, unapproved).
