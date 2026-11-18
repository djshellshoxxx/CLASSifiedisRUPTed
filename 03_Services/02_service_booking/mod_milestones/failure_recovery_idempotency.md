# PS-031-06 — failure recovery idempotency

**Status:** SPECIFIED — Stage 3 draft, pending review.
**Requirement ID:** PS-031-06. **Owner:** [03_Services/02_service_booking/mod_milestones](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_milestones. **Consumers:** F07 identity, F10 privacy, F15 platform, F16 security (per [dependency matrix](../../../DEPENDENCY_MATRIX.md)); mod_disputes (PS-030) and mod_quotes (PS-032) as dependencies.

## Purpose and scope
Business outcome: a party whose request times out, a dependency that is down, two devices that write at once, or a duplicated event delivery never leaves a plan or item in a state that no listed transition explains, and never applies the same effect twice.

Exclusions: offline pending queue on the client (D08, PWA layer, not this module); dispute decision logic (PS-030); payment failure or reversal (not in scope; no payment exists here).

## Requirements
- PS-031-06.R01: Every state change is one database transaction that writes the row change, the append-only evidence row, the idempotency result and the outbox row together, or none of them.
- PS-031-06.R02: Concurrency, retry, timeout, partial-failure and duplicate-event cases are each handled by a rule below and by a test ID in contract_and_acceptance_tests.md.
- PS-031-06.R03: Budgets: command server timeout 2 s; dependency call timeout 1 s; total request budget 3 s; outbox publish lag p95 5 s.
- PS-031-06.R04: Recovery never deletes evidence. Compensation is always a new forward record (new revision, new decision, or cancellation), never an UPDATE of an append-only row.

## Idempotency
- Every write carries `Idempotency-Key` (ULID). The key scope is (`actor_participant_id`, `command_name`, `idempotency_key`).
- `request_digest` is SHA-256 over canonical JSON of the request body excluding `Idempotency-Key`.
- Same scope and same digest: return the stored `result_status` and body (re-read of current view is not performed; the stored body is returned). Same scope and different digest: `MILESTONES_IDEMPOTENCY_KEY_REUSED` (409).
- Missing key: `MILESTONES_IDEMPOTENCY_KEY_MISSING` (400).
- Keys expire after 7 days (A-MILESTONES-10). A retry after expiry is treated as a new command and is protected only by the optimistic lock on `expected_row_version`.
- Commands that fail validation before a transaction starts store nothing in the log, so the client may correct and resend with the same key.
- Commands that fail with `MILESTONES_INTERNAL` or dependency errors store nothing; retry with the same key is safe.

## Concurrency
- Optimistic locking on `milestone_plan.row_version` and `milestone.row_version`. Each write sends `expected_row_version`; mismatch returns `MILESTONES_REVISION_CONFLICT` (409, retryable). The client re-reads and decides whether to retry.
- Plan-level commands take `SELECT ... FOR UPDATE` on the plan row first. Item commands lock the plan row, then the item row, in that order, to prevent deadlock.
- Two consents racing on the same revision: the second writer finds the first consent row, and the plan is advanced once by the transaction that inserts the second consent. Both see the same final state.
- Start and submit racing: resolved by the row lock; the loser gets `MILESTONES_REVISION_CONFLICT`.
- Dispute outcome racing with accept or reject: item must be `disputed` for the outcome, so a prior accept or reject returns `MILESTONES_INVALID_TRANSITION` to the dispute consumer; the consumer records the rejection and does not retry.

## Timeouts and retries
| Call | Timeout | Retry policy | On final failure |
|---|---|---|---|
| Booking query (booking_ref check) | 1 s | 2 retries, 100 ms then 300 ms, jittered | MILESTONES_DEPENDENCY_UNAVAILABLE; no state change |
| Quote query (quote_ref check) | 1 s | same | same |
| Dispute query (dispute_ref check) | 1 s | same | same |
| Database write | 2 s | none at application level; retry only on serialization failure, max 2 | MILESTONES_INTERNAL |
| Outbox publisher to bus | 3 s | unlimited with backoff 1 s to 60 s, jittered | rows stay unpublished; alert after 5 min |
| Scheduler timer run | 30 s per batch | next tick | next run picks up the same rows; idempotent |

Circuit breaker per dependency: open after 5 failures in 30 s; half-open probe after 30 s. While open, commands needing that dependency fail fast with `MILESTONES_DEPENDENCY_UNAVAILABLE`; read commands and item start or submit that need no dependency keep working.

## Partial failure and recovery
- Crash after transaction commit but before response: client retries with same key; the stored result returns. No duplicate effect.
- Crash before commit: nothing persisted; retry runs fresh.
- Outbox publish failure: event row remains with `published_at` NULL; the publisher re-sends the same `event_id`. Consumers deduplicate on `event_id`.
- Duplicate dispute event: `dispute_event_id` is recorded in the decision row; a second delivery finds the item already accepted or cancelled and returns success without a second effect.
- Expiry timer running twice: conditional update `WHERE milestone_state IN ('pending','in_progress') AND due_date + 7 days < now`; second run updates zero rows.
- Revision applied partially: impossible by design; revision application is one transaction over all items. A failed application leaves the proposal pending.
- Plan cancelled while a submit is in flight: the lock order makes the submit see `cancelled` and return `MILESTONES_INVALID_TRANSITION`.

## Rollback and backup boundaries
- Schema changes follow expand then contract. No migration drops or rewrites an append-only table.
- Database point-in-time recovery restores to a consistent transaction boundary. After restore, the publisher re-sends any event whose `published_at` is NULL; consumers dedupe on `event_id`. Events already published may be re-sent; this is safe.
- Code rollback: the feature flag `services.milestones.enabled` (A-MILESTONES-14) is switched off first. Off means new commands return `MILESTONES_FEATURE_DISABLED`; reads continue so parties can see their records.
- A plan created by a faulty release is not deleted. It is cancelled with reason code `PLAN_WITHDRAWN` through a forward command and kept as evidence.

## Assumptions and open decisions
- A-MILESTONES-10: Idempotency retention is 7 days; outbox published rows retained 30 days; commerce records 3 years after terminal state (D07 open).
- A-MILESTONES-14: Feature flag defaults to off.
- Open: whether the outbox uses the same database or a separate queue is an F15 platform decision; this spec assumes same database.
