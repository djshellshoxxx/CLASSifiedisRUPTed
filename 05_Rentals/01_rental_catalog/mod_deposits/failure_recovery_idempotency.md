# PS-040-06 — failure recovery idempotency

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-040-06. **Owner:** [05_Rentals/01_rental_catalog/mod_deposits](SPEC.md). **Implementing module:** 05_Rentals/01_rental_catalog/mod_deposits. **Consumers:** PWA client (pending queue), notifications, observability, operations (reconciliation jobs).

## Purpose and scope
Define retry, timeout, idempotency, concurrency-conflict and partial-failure recovery for deposit commands, queries, timers and event delivery. No failure path may move money, and no failure path may leave a state change without its event.

## Requirements
- PS-040-06.R01: Business outcome: any command either commits once with its event, or changes nothing. Clients can retry safely. Exclusions: exactly-once delivery to external consumers, and any real-world compensation.
- PS-040-06.R02: Case coverage: lost response after commit, duplicate delivery, concurrent accept and cancel, timer racing a command, dependency outage during a guard, crash between commit and publish, duplicate create for the same rental, and offline replay after long disconnect.
- PS-040-06.R03: Recovery targets are measurable: no lost committed events, no duplicate state changes, and reconciliation within 5 minutes of a fault clearing.
- PS-040-06.R04: Clients never retry a non-retryable code (see validation_rules.md). Retryable codes use the backoff in this file.
- PS-040-06.R05: The PWA keeps offline writes in a local pending queue until the server acknowledges them (D08). Queued commands carry the same idempotency key across retries and app restarts.

## Retry and timeout policy
| Operation | Client retry | Backoff | Attempts | Server timeout | Notes |
|---|---|---|---|---|---|
| state commands | yes, retryable codes only | full jitter; base 500 ms; x2; cap 8 s | 5 | 3 s handler | same idempotency key |
| queries | yes | same | 3 | 2 s | no idempotency key needed |
| rental status read (guard) | server-side | 1 retry, 100 ms | 2 | 800 ms | breaker opens after 5 failures in 30 s; half-open after 30 s |
| identity read (F07) | server-side | 1 retry, 100 ms | 2 | 800 ms | same breaker rule |
| outbox publish | server-side | exponential; base 1 s; cap 5 min | unlimited, alerting after 10 | 2 s | at-least-once |
| timer execution | server-side | re-leased on next scan | unlimited | 2 s | idempotent by scheduled_revision |

Client request timeout: 5 seconds. A timed-out command is retried with the same idempotency key, never with a new one.

## Idempotency
- Key scope: (actor_participant_id, command, idempotency_key). Retained 72 hours (A-deposits-14).
- The server stores request_hash and response_snapshot in the same transaction as the state change.
- Same key and same hash: return the stored response with `replayed: true`. No new event.
- Same key and different hash: DEPOSITS_CONFLICT_IDEMPOTENCY_PAYLOAD_MISMATCH.
- A key that failed before commit is not stored, so a retry runs fresh.

## Concurrency control
- Every state command runs in one transaction that locks the deposit row (SELECT FOR UPDATE) before reading state.
- Order of checks under lock: expected_revision equals current revision (else DEPOSITS_CONFLICT_REVISION_MISMATCH), then state allows the command (else DEPOSITS_STATE_TRANSITION_NOT_ALLOWED), then guards.
- Creating a second active deposit for the same rental_ref is prevented by the partial unique index (DEPOSITS_CONFLICT_ACTIVE_DEPOSIT_EXISTS).
- Timers lock the same row and check scheduled_revision. A command that committed first wins.
- Lock wait limit: 1 second. Exceeding it returns DEPOSITS_INTERNAL with retryable true.

## Partial failure table
| Failure | Effect | Recovery |
|---|---|---|
| Rental or identity read fails before commit | No state change | DEPOSITS_DEPENDENCY_UNAVAILABLE; client retries with same key |
| Commit succeeds, response lost | Client does not know outcome | Retry with same key returns stored response |
| Commit fails | No state change, no event | Client retries; fresh execution |
| Commit succeeds, outbox publish fails | Event pending in outbox | Reconciliation publishes; consumers dedupe on event_id |
| Process crashes mid-timer | Timer lease expires | Another worker re-runs; scheduled_revision check prevents double transition |
| Command races timer | One wins under lock | Loser gets REVISION_MISMATCH or TRANSITION_NOT_ALLOWED |
| Duplicate create for same rental | Second insert rejected | DEPOSITS_CONFLICT_ACTIVE_DEPOSIT_EXISTS |
| Offline replay after long gap | Command may be stale | Server applies revision check; client shows refreshed state and does not auto-resubmit a changed term |
| Database failover | In-flight transactions roll back | Clients retry; no partial rows |

## Recovery jobs
- Outbox sweeper: every 60 seconds, publishes events unsent for more than 60 seconds.
- Timer sweeper: every 60 seconds, executes timers where fire_at is past and status is pending. Alerts on any timer more than 15 minutes overdue.
- Reconciliation: every 5 minutes, checks that each committed deposit_event has a matching outbox row and that revision numbers are contiguous. Mismatches are alerted, not auto-corrected.

## Assumptions and open decisions
- A-deposits-19: Timeout and retry numbers above are first-pass defaults. Load tests in contract_and_acceptance_tests.md confirm them.
- A-deposits-20: Transactional outbox with at-least-once delivery. Consumers deduplicate.
- Open: whether the reconciliation alert is paged or ticketed (operations choice, F15).

## Test cases
- TEST-PS-040-06-T01: Commit accept, drop the response, retry with the same key. Pass: one state change; retry returns replayed = true. Fail: two events or a second transition.
- TEST-PS-040-06-T02: Kill the worker after commit before publish. Pass: event published within 5 minutes. Fail: event never published.
- TEST-PS-040-06-T03: Run accept and cancel simultaneously on one proposed deposit. Pass: exactly one succeeds; the other returns a 409 code. Fail: both succeed or a 500 is returned.
