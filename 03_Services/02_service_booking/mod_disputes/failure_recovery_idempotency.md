# PS-030-06 — failure recovery idempotency

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-030-06. **Owner:** [03_Services/02_service_booking/mod_disputes](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_disputes. **Consumers:** F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); event subscribers in [commands_queries_events.md](commands_queries_events.md).

## Purpose and scope
Defines how commands, timers, evidence uploads and event publication behave under retries, timeouts, concurrency conflicts, partial failure and offline replay. Goal: a dispute never reaches a state the transition table forbids, a committed transition is never lost, and a client that repeats a request never produces a second effect.

Exclusions: infrastructure failover design (F15 platform); client offline storage UX (owner not assigned in [CONTRACTS.md](../../../planning/CONTRACTS.md); decision D08 OPEN); upload service internals (A-disputes-05).

## Requirements
- **PS-030-06.R01**: Business outcome: an accepted command is applied exactly once; a rejected command has no effect; an ambiguous outcome (timeout) is resolved by replaying the same key. Actors: clients, relay, timer worker. Exclusions as above.
- **PS-030-06.R02**: Cases covered: duplicate submission, body mismatch on reused key, timeout after commit, lost response, stale revision, row-lock contention, event publish failure, timer missed during outage, evidence finalize failure, dependency outage, concurrent accept and withdraw, offline replay after 72 hours.
- **PS-030-06.R03**: Budgets: command deadline 5 s end to end; booking eligibility call timeout 1.5 s with 2 retries; upload finalize deadline 10 s; row-lock wait 2 s; circuit breaker opens after 50% failures in 20 calls within 30 s, half-opens after 30 s.
- **PS-030-06.R04**: Commit and outbox write share one database transaction. Event publication is at-least-once with consumer dedup on `event_id`.
- **PS-030-06.R05**: Timers are at-least-once and idempotent by dedup key `(dispute_id, timer_name, deadline_at)`.
- **PS-030-06.R06**: Offline: the client holds writes as pending until the relay acknowledges them. Pending writes carry the Idempotency-Key generated on creation and the `expected_revision` last seen.

## Idempotency semantics
1. Relay receives command with `Idempotency-Key`. It looks up `(actor_ref, command_name, key)` in `idempotency_record`.
2. No row: insert with `state = in_progress` and `request_hash`. Execute the command in a transaction. On commit, set `state = completed` and `response_ref`. Both happen in the same transaction as the domain write.
3. The idempotency row is inserted inside the same transaction as the domain write, so `in_progress` is visible only while that transaction is open. A concurrent request with the same key blocks on the unique index for at most 2 s; if the first transaction is still open after that, return `DISPUTES_IDEMPOTENCY_IN_PROGRESS` (retry after 1 s).
4. If the first transaction rolled back, the insert succeeds for the second request and it executes normally. No `in_progress` row can outlive a crashed attempt.
5. Row `completed`, same hash: return the stored resource ID and original status code, with `Idempotent-Replayed: true` header.
6. Row exists, different hash: `DISPUTES_IDEMPOTENCY_KEY_REUSED`, no effect.
7. Rows expire after 72 hours; a later replay is treated as a new command, which will then usually fail on state or revision.

## Concurrency control
- Every write against an existing dispute takes `SELECT ... FOR UPDATE` on the `dispute` row, with lock wait capped at 2 s. On timeout: `DISPUTES_BUSY` (retryable after 200 ms).
- After the lock: compare `expected_revision` with stored `revision`. Mismatch returns `DISPUTES_REVISION_CONFLICT` with `current_revision`. Clients refetch and retry with a new key only after confirming the state.
- Lock ordering: dispute row first, then child rows (settlement, evidence). No path locks children first.
- Timer workers take the same dispute lock, then re-check the deadline and state. A timer that no longer applies is recorded as a no-op with reason `superseded`.
- Concurrent accept of settlement and withdraw: whichever commits first wins. The loser sees `DISPUTES_STATE_CONFLICT` or `DISPUTES_REVISION_CONFLICT`. No partial application.

## Retry and timeout policy
| Operation | Timeout | Retries | Backoff | Final behavior |
|---|---|---|---|---|
| Booking eligibility lookup (OpenDispute) | 1.5 s | 2 | 200 ms, x2, jitter 20%, cap 1 s | `DISPUTES_DEPENDENCY_UNAVAILABLE`; no dispute created |
| Identity or block lookup | 1.5 s | 2 | as above | `DISPUTES_DEPENDENCY_UNAVAILABLE` |
| Upload finalize (evidence) | 10 s | 3 | 500 ms, x2 | Evidence stays `pending`; retry from client with same ticket |
| Event publish from outbox | 3 s | unlimited | exponential to 60 s | Outbox row retained; alert after 15 min age |
| Client command retry | n/a | client decides | client exponential with jitter | Idempotency replay makes retries safe |

Breaker open on booking lookup: new OpenDispute returns `DISPUTES_DEPENDENCY_UNAVAILABLE` immediately. Reads, responses and moderator actions continue, since they do not call the booking service.

## Partial failure scenarios
| Scenario | Behavior | Recovery |
|---|---|---|
| Commit succeeded, response lost | Client retries same key | Replay returns stored result |
| Client timeout before request reached relay | No row exists | Retry runs normally |
| Crash after domain write, before outbox | Impossible: same transaction | None needed |
| Outbox publish fails repeatedly | Event row stays pending | Publisher retries; alert at 15 min; reconciler compares outbox with transition log hourly |
| Evidence binary uploaded, finalize fails | `state = pending`, `upload_ref` retained | Client retries finalize; ticket valid 24 h; after expiry `DISPUTES_UPLOAD_EXPIRED` and pending row purged |
| Evidence hash mismatch | Row not finalized | `DISPUTES_EVIDENCE_HASH_MISMATCH`; client re-uploads a new ticket |
| Upload service down | SubmitEvidence for binary returns `DISPUTES_DEPENDENCY_UNAVAILABLE`; text statements still accepted | Retry when service recovers |
| Timer worker down past deadline | Timers remain due in table | On restart, overdue timers processed in deadline order; each fires at most once via dedup key |
| Timer fires after party responded | Dedup and state re-check | Recorded as `superseded`, no transition |
| Parent booking cancelled after dispute opened | Dispute remains valid | No automatic close; booking status change is consumed as data only (A-disputes-02) |
| Clock skew on client | Client deadlines are advisory | Server computes all deadlines |
| Event consumer down | Events retained in outbox and log | Consumer replays from `event_id` cursor; consumers dedupe |

## Offline behavior (PWA)
- Creating a dispute offline stores a local pending record with a client-generated `Idempotency-Key` and `expected_revision` = 0 (OpenDispute) or the last known revision.
- Pending records are not visible to the counterparty until the relay acknowledges. The UI labels them "pending" (message key `disputes.pending.label`).
- Replay order: pending writes for one dispute are sent in creation order, one at a time. A `DISPUTES_REVISION_CONFLICT` on replay stops the queue for that dispute and prompts the user with the current state. Client never auto-merges statements.
- Pending items expire from the local queue after 7 days and are then shown for manual resubmission. The 72-hour server idempotency window is shorter than the client queue window, so a very old replay becomes a new command. This is accepted (A-disputes-07).
- D08 (PWA offline writes) is OPEN. This section assumes the local pending queue described above.

## Recovery runbook (operators)
1. Compare outbox rows older than 15 minutes with consumer acknowledgements. Replay from cursor; do not edit events.
2. Verify each dispute's `revision` sequence in `transition` has no gaps. Gaps trigger reconciliation from logs; no manual status edits.
3. Re-run timer scan for rows with `deadline_at` in the past; confirm dedup keys prevented duplicates.
4. Purge expired `pending` evidence and `idempotency_record` rows past `expires_at`.

## Open decisions
- A-disputes-07: Timeouts, retention windows and queue expiry values above are defaults.
- A-disputes-14: Timers are at-least-once and never auto-decide.
- D08 (PWA offline writes) is OPEN; this file adopts the local pending queue until relay acknowledgment.
