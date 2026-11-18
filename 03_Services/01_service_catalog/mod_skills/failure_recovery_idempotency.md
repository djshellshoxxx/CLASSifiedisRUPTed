# PS-029-06 — failure recovery idempotency

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-029-06. **Owner:** [03_Services/01_service_catalog/mod_skills](SPEC.md). **Implementing module:** 03_Services/01_service_catalog/mod_skills (module ID F03.S01.M01). **Consumers:** shared F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); module-level notifications, evidence, moderation and observability per [module SPEC](SPEC.md).

## Purpose and scope
Defines how skill-offer commands behave under retries, timeouts, duplicate delivery, concurrent edits, outbox failures, offline replay and partial failure, so that every state change is applied at most once and the record is never left half-written. Lifecycle rules are in [workflow](workflow_state_machine.md); command envelope is in [commands](commands_queries_events.md).

Exclusions: infrastructure-level high availability design (F15 platform), disaster recovery of the whole platform (F15), and any real-world completion of an offer. No funds are held or released by this module, so there is no compensating payment flow.

## Requirements
- PS-029-06.R01: Business outcome: a participant who retries, reconnects or double-taps gets exactly one effective change and a clear result. Actors: owner client, command service, outbox dispatcher, sweep jobs. Exclusions as above.
- PS-029-06.R02: Case coverage: client timeout after server commit; duplicate command in flight; same key with different payload; stale `expected_revision`; sweep racing an owner edit; event publish failure after commit; scheduler crash mid-sweep; offline queue replay after server applied the change; server restart during a write.
- PS-029-06.R03: Accessibility and budgets: a retryable failure is shown to the user as "saving again" with no data loss; retry behavior must not exceed the budgets in [observability_performance.md](observability_performance.md).
- PS-029-06.R04: Every state change and its `skill_offer_transition` row and outbox row commit in one database transaction. Partial application is impossible by design.
- PS-029-06.R05: Idempotency keys are scoped to the owner and the command name. The same key on a different command is treated as a new request and rejected as reuse if the body hash differs.
- PS-029-06.R06: Outbox delivery is at-least-once. Consumers deduplicate on `event_id`.
- PS-029-06.R07: Offline writes stay in the client pending queue until a server acknowledgment is received (D08). The queue never sends a write whose `expected_revision` is stale without a reread.

## Retry policy
| Caller | Retry when | Backoff | Max attempts | Stop condition |
|---|---|---|---|---|
| Client command | 5xx, `SKILLS_TEMPORARILY_UNAVAILABLE`, `SKILLS_IDEMPOTENCY_IN_PROGRESS`, network timeout, `SKILLS_RATE_LIMITED` (use `Retry-After`) | Exponential, base 500 ms, factor 2, full jitter, cap 30 s | 6 | Any non-retryable error, or success |
| Client command, revision conflict | Never blind retry | Client rereads the record, merges, then sends a new key | n/a | User cancels |
| Server to database | Serialization failure or deadlock | Base 50 ms, factor 2, jitter | 3 | Then return `SKILLS_TEMPORARILY_UNAVAILABLE` |
| Outbox dispatcher | Broker publish failure | Base 1 s, factor 2, cap 1 h | Until 24 h age | Dead-letter queue for operator review (A-skills-17) |
| Sweep job | CAS conflict on a record | Next scheduled run | n/a | Record skipped, counted in metrics |

## Timeouts
- Server command budget: 2 s hard limit per command, enforced by the service. On expiry the transaction is rolled back and the client receives `SKILLS_TEMPORARILY_UNAVAILABLE` (retryable).
- Client request timeout: 10 s. A client timeout does not mean failure; the client retries with the same key (see next section).
- Outbox publish timeout: 5 s per attempt.
- Idempotency in-progress lock TTL: 10 s (A-skills-16). A stale lock after this TTL is recoverable by the next attempt.

## Idempotency
1. Server computes `key_hash = SHA-256(owner_participant_id || command_name || idempotency_key)` and `request_hash = SHA-256(canonical JSON body)`.
2. No row: insert in-progress row, run the command, store `skill_id`, `result_revision` and response snapshot in the same transaction as the state change.
3. In-progress row exists and is fresh: return `SKILLS_IDEMPOTENCY_IN_PROGRESS` (409, retryable after 1 s).
4. Completed row with same `request_hash`: return the stored response with `result = replayed`. No write, no event.
5. Completed row with different `request_hash`: return `SKILLS_IDEMPOTENCY_KEY_REUSED` (422, not retryable).
6. Row expired (older than 24 h, A-skills-16): treated as new. Safe because the state-change revision check still applies.

## Concurrency conflicts
- Every owner write checks `expected_revision` inside the transaction with a row lock on the skill offer.
- Mismatch returns `SKILLS_REVISION_CONFLICT` (409, not retryable). The response includes the current `revision` and `state`, not the content, so the client can reread.
- Sweeps update with `WHERE revision = :read_revision`. Zero rows updated means skip.

## Partial failure and recovery
| Failure point | State after failure | Recovery |
|---|---|---|
| Before commit | Unchanged | Client retry with same key |
| After commit, before response | Changed | Client retry gets `replayed` response |
| Outbox write fails inside transaction | Transaction rolls back; no change | Client retry |
| Broker publish fails after commit | Changed; event pending in outbox | Dispatcher retries; no client action |
| Dispatcher crash mid-batch | Changed; some events pending | Re-dispatch; consumers dedupe on `event_id` |
| Sweep crash mid-run | Partially swept | Next run resumes; CAS prevents double transition |
| Import batch fails | Whole batch rolled back | See [import/export](import_export_backup_rollback.md) |
| Relay or network outage (client) | Pending locally | Queue replay, see offline rules |

## Offline replay rules (D08 default)
- Pending queue: at most 50 commands and 7 days per participant (A-skills-18). Oldest commands are dropped only with a visible notice and never silently.
- Each queued command keeps its original idempotency key, so replay after server acknowledgment is a no-op.
- A queued update or publish whose `expected_revision` is stale is not sent. The client shows a conflict and asks the user to review the current version.
- Replay order is FIFO per `skill_id`.

## Error codes defined here
| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| `SKILLS_REVISION_CONFLICT` | 409 | no (reread) | `expected_revision` does not match |
| `SKILLS_IDEMPOTENCY_IN_PROGRESS` | 409 | yes, after 1 s | Same key still running |
| `SKILLS_IDEMPOTENCY_KEY_REUSED` | 422 | no | Same key, different body |
| `SKILLS_RATE_LIMITED` | 429 | yes, after `Retry-After` | Write or search rate exceeded (A-skills-20) |
| `SKILLS_TEMPORARILY_UNAVAILABLE` | 503 | yes | Timeout or dependency failure |
| `SKILLS_FEATURE_DISABLED` | 503 | no until flag on | `skills.enabled` off for region |
| `SKILLS_CURSOR_INVALID` | 400 | no | Expired or tampered search cursor |

State and access codes (`SKILLS_STATE_TRANSITION_INVALID`, `SKILLS_OFFER_EXPIRED`, `SKILLS_FORBIDDEN`, `SKILLS_NOT_FOUND`, `SKILLS_PARTICIPANT_BLOCKED`) are defined in [workflow](workflow_state_machine.md) and [authorization](authorization_capabilities.md).

## Assumptions
- A-skills-16: Idempotency key retention is 24 hours; in-progress lock TTL is 10 seconds; key is at least 26 characters.
- A-skills-17: Outbox retries until 24 hours of age, then moves to a dead-letter queue. Operators review dead letters within one business day (operational target, not enforced by code).
- A-skills-18: Offline pending queue is 50 commands or 7 days, whichever comes first (D08 recommended default, adopted here for drafting only).

## Open decisions
- D08 (PWA offline writes): queue size and TTL are the recommended defaults and are not approved.
- Whether the command service needs a separate idempotency store from the main database. Default here: same database, same transaction.

## Testing
- TEST-PS-029-06-T01: Client timeout after commit, then retry with same key. Pass when the retry returns `replayed` and the transition count is 1.
- TEST-PS-029-06-T02: Two identical requests sent concurrently. Pass when one returns `applied`, the other returns `SKILLS_IDEMPOTENCY_IN_PROGRESS` or `replayed`, and exactly one transition row exists.
- TEST-PS-029-06-T03: Same key with a different body. Pass when `SKILLS_IDEMPOTENCY_KEY_REUSED` is returned and no write occurs.
- TEST-PS-029-06-T04: Fault injected between state write and outbox write. Pass when neither row is present after rollback.
- TEST-PS-029-06-T05: Sweep and owner update race on the same revision. Pass when exactly one wins and the other is skipped or rejected.
- TEST-PS-029-06-T06: Broker unavailable for 10 minutes. Pass when outbox rows persist, zero are lost, and all are delivered after recovery with consumers deduplicating.
- TEST-PS-029-06-T07: Offline queue of 51 commands. Pass when the 51st is refused locally with a visible notice and the 50 are replayed in FIFO order.
