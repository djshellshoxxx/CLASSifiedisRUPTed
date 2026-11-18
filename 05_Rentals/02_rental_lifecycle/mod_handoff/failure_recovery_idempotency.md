# PS-042-06 — failure recovery idempotency

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-042-06. **Owner:** [05_Rentals/02_rental_lifecycle/mod_handoff](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_handoff. **Consumers:** provisional, per [dependency matrix](../../../DEPENDENCY_MATRIX.md) and sibling [mod_return](../mod_return/SPEC.md); subscriber map confirmed in Prompt 3.

## Purpose and scope
Defines timeouts, retries, idempotency, concurrency control and recovery after partial failure for handoff commands, timers and events. Offline behaviour follows D08 (local pending queue until relay acknowledgement). This module never treats a client-side pending state as a confirmed handover.

## Requirements
- PS-042-06.R01 — Business outcome: no command is applied twice, no transition exists without its transition row and event, and no party is left in a state they cannot leave without a defined path (confirm, cancel, dispute, expiry or moderator resolution).
- PS-042-06.R02 — Cases covered: client timeout after server commit; duplicate delivery; two confirmations racing; relay crash between state write and event publish; agreement service outage during create; scheduler restart mid-batch; poison event; offline queue drained after the window expired; device clock far ahead.
- PS-042-06.R03 — Budgets: command deadline 3 s server-side; client retries bounded; recovery time after relay restart ≤ 60 s for timers and ≤ 5 min for outbox drain.
- PS-042-06.R04 — Concurrency control: optimistic revision on every mutation, plus a row lock on the handoff row inside the transition transaction.
- PS-042-06.R05 — Recovery runbook: every recovery step is idempotent and documented in terms of IDs and counts only, with no personal data.

## Timeouts
| Hop | Timeout | Notes |
|---|---|---|
| Client to relay, mutating command | 10 s | client then retries with the same Idempotency-Key |
| Client to relay, query | 5 s | no retry beyond 2 attempts |
| Relay to agreement service | 1 s | circuit breaker opens at 50% failures over 30 s |
| Relay to catalog and evidence store | 1 s | `HANDOFF_UPSTREAM_UNAVAILABLE` on timeout |
| Relay command, total server-side | 3 s | exceeding it returns `HANDOFF_UPSTREAM_UNAVAILABLE`; commit state unknown to client, so the key matters |
| Scheduler batch | 30 s | batch aborts and resumes on next tick |

## Retry policy
- Client retries only on network error, timeout, `HANDOFF_RATE_LIMITED` (after `Retry-After`), `HANDOFF_UPSTREAM_UNAVAILABLE`, `HANDOFF_INTERNAL_ERROR`, and `HANDOFF_CONFLICT_REVISION` after refetch.
- Backoff: base 1 s, factor 2, jitter ±20%, maximum 5 attempts, then the operation is parked in the offline queue.
- Server to agreement service: 2 retries at 100 ms and 200 ms with jitter. No retry on 4xx.
- Retries of a command reuse the original Idempotency-Key. A new key for a retry of the same intent is a defect.

## Idempotency
- **Assumption A-handoff-09:** Idempotency keys are ULIDs supplied by the client, scoped to (participant_id, command name), and stored with the canonical body hash, response status and response body for 7 days.
- A receipt is written in the same transaction as the transition. A replay within 7 days returns the stored response.
- After 7 days, a replay with an old key is treated as a new command; `expected_revision` then rejects it unless the state is unchanged, in which case it would be rejected as invalid state or already confirmed.
- Receipts are not shared across commands or participants.

## Concurrency conflicts
- Transition transaction: `SELECT ... FOR UPDATE` on the handoff row, check `expected_revision`, check state guard, insert transition row, update handoff, insert outbox row, commit.
- Two confirmations from different parties racing: the first commits (T06 or T07); the second sees a changed revision and returns `HANDOFF_CONFLICT_REVISION`. Client refetches, sees `lessor_confirmed`, and submits T08 with the new revision. Outcome: one `completed` transition, two attestations, no lost write.
- A party confirming twice with different keys: second call returns `HANDOFF_ALREADY_CONFIRMED`.
- Timer versus command race: the row lock serializes them. A command that commits first wins; the timer re-evaluates its guard and skips if the state no longer matches.

## Partial failure and recovery
- **Commit and publish:** state, transition row, receipt and outbox row commit atomically. A transactional outbox publisher delivers events at least once. A crash before publish leaves the outbox row pending; the publisher resumes on restart.
- **Relay crash before commit:** nothing applied. The client retries with the same key.
- **Relay crash after commit, before response:** the client retries; the receipt returns the original response.
- **Agreement service outage during create:** returns `HANDOFF_UPSTREAM_UNAVAILABLE`; nothing is written. Create is never completed on a guess about agreement state.
- **Agreement cancelled while handoff active:** the agreement event triggers T13. If the event is lost, the periodic reconciliation job (every 15 minutes) queries agreement status for active handoffs and applies T13 idempotently.
- **Scheduler restart:** timers are evaluated from stored deadlines, not from in-memory schedules. The batch uses row claims with a lease of 2 minutes so two workers never expire the same row.
- **Poison event:** an event that fails consumer validation is retried 5 times, then parked in a dead-letter queue with IDs only. Parking does not change handoff state.

## Offline behaviour (D08)
- **Assumption A-handoff-14:** A client holds at most 50 pending mutating commands, with a time-to-live of 72 hours. Commands replay in order per `handoff_id`.
- Client shows pending commands as "waiting to send", never as confirmed. Confirmed state comes only from a relay response or a fresh query.
- On replay, a command whose window has passed is sent anyway. The server decides (`HANDOFF_EXPIRED` or `HANDOFF_INVALID_STATE`), and the client shows the server's result.
- A queued confirmation carries `client_recorded_at`. The server stores it as advisory only ([A-handoff-19](domain_schema.md)).
- Queue overflow: the oldest non-confirmation command is dropped with a visible notice; confirmations are never dropped silently.

## Assumptions and open decisions
- **Assumption A-handoff-09:** Idempotency key format, scope and 7-day retention as above.
- **Assumption A-handoff-14:** Offline queue of 50 commands and 72-hour time-to-live.
- Open decisions in this file: D08 (offline writes, OPEN); D04 (partial execution; recovery is compensating, not atomic).
