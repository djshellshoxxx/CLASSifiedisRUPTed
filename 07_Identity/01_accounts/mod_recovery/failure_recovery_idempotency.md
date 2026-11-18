# PS-053-06 — failure, recovery, idempotency
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_recovery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-053-06.R01 | State change and outbox row commit in one transaction. Notification delivery failure never rolls back a state change. | MVP |
| PS-053-06.R02 | Each OTP and recovery code is single use. Second use returns `MOD_RECOVERY.PROOF_INVALID` and counts as an attempt. | MVP |
| PS-053-06.R03 | Concurrent `submit_proof` with the same `expected_revision`: exactly one commit. Attempt counter updated inside the same transaction. | MVP |
| PS-053-06.R04 | Email or SMS provider calls: timeout 5 s, 3 attempts, exponential backoff with full jitter (base 1 s, cap 30 s). | MVP |
| PS-053-06.R05 | `complete` is atomic: credential rotation and session revocation commit together, or the request stays `verified`. | MVP |
| PS-053-06.R06 | Recovery commands are online-only. They are never queued offline (D08 exclusion) to prevent replay of stale proofs. | MVP |

## Data / schema
Outbox table `recovery_outbox` (id, rec_id, template_key, status, attempts, next_attempt_at). Contains no contact address; recipient resolved at send time.

## Commands / queries / events
Idempotent replay of `recovery.start` returns original `request_ref` within 7 days (CTR-EVT-001 R03). Replay of other commands returns the original result when `expected_revision` matches the stored result.

## States & transitions
Failure paths map to transitions in [workflow_state_machine](workflow_state_machine.md): provider failure leaves state unchanged; expiry during delivery moves to `expired`.

## Validation & errors
Provider failure surfaces to the client as `SYS.UNAVAILABLE` (retryable) only on `start`, after the request row is created with state `requested` and outbox retries pending.

## Authorization
Retry does not re-check authorization for outbox sends; the outbox row is created only after authorization passes.

## Failure, idempotency, concurrency, offline
- Scheduler crash: expiry and lock release are checked on read (PS-053-03.R05).
- Clock skew: deadlines use server clock; client clock is never trusted.
- Partial rotation: failure in `complete` rolls back to `verified`; alert raised.

## Privacy, retention, abuse
Outbox rows purged 24 h after `sent` (RET-EPH).

## Observability & budgets
`recovery_outbox_attempts_total{result}`; `recovery_complete_rollbacks_total` must be 0 in steady state.

## Tests
TEST-PS-053-11 (provider timeout and retry), TEST-PS-053-12 (concurrent proof submission), TEST-PS-053-13 (complete rollback injection), TEST-PS-053-14 (offline submission rejected).

## Acceptance criteria
1. Fault-injection tests show no half-rotated credential in any run.
2. Single-use proof enforced under 50 parallel submissions.

## Assumptions & open decisions
- ASSUMPTION: retry values above.
- PROVISIONAL (D08 default, unapproved): recovery excluded from offline queue.
