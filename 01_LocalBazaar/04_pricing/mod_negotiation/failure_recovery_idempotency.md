# PS-010-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/04_pricing/mod_negotiation. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (idempotency R03, revision R02, offline timestamps R04), CTR-ERR-001 (retry guidance, codes), CTR-CAP-001 (fail-closed decisions), CTR-ID-001.

**Decision labels:** Offline pending queue for negotiation writes is PROVISIONAL (D08 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-010-06.R01 | A duplicate active (listing, initiator) pair is blocked by a unique constraint on the persisted record, not only by application checks. | MVP |
| PS-010-06.R02 | Every state change and its `negotiation.*` event commit in one transaction. No partial state is observable. | MVP |
| PS-010-06.R03 | Idempotency key scope = (actor, command, key), retained 7 days (CTR-EVT-001 R03). Replays return the original result with no new event. | MVP |
| PS-010-06.R04 | Concurrent writers use `expected_revision`. Mismatch → `EVT.REVISION_CONFLICT`; the client re-reads and re-decides. | MVP |
| PS-010-06.R05 | Timer jobs (expiry, void) are idempotent and resumable. A missed run is caught up on the next run. Lag alarm at 5 min (see PS-010-08). | MVP |
| PS-010-06.R06 | Offline pending writes (counter, accept, reject, withdraw) are re-validated at server commit. Stale pending writes return the code that applies and are shown as "not applied". They are never silently dropped (CTR-ERR-001). | MVP |

## Data / schema
Storage constraints: unique partial index on (`listing_id`, `initiator_id`) where state = `AWAITING_RESPONSE`. Idempotency records: (actor, command, key, request digest, result, created_at), 7-day TTL. Revision column on the aggregate.

## Commands / queries / events
Retry-safe commands: all state-changing commands with `idempotency_key`. Read commands: no key required. System timers: keyed on (`negotiation_id`, reason).

## States & transitions
Recovery never invents a transition. A crash leaves the record in its last committed state; timers re-evaluate deadlines from stored `response_deadline`.

## Validation & errors
| Scenario | Behavior | Code |
|---|---|---|
| Same key, same digest | Original result | — |
| Same key, different digest | Rejected | `EVT.IDEMPOTENCY_KEY_REUSED` |
| Stale `expected_revision` | Rejected, no event | `EVT.REVISION_CONFLICT` |
| Second open for same pair | Rejected | `NEG.OPEN_EXISTS` |
| Command after deadline | Rejected; expiry job transitions | `NEG.WINDOW_CLOSED` (retryable false) |
| Dependency down (policy, store) | Fail closed | `SYS.UNAVAILABLE` (retryable true) |
| Feature flag off | Rejected for writes | `NEG.FEATURE_DISABLED` (retryable true) |

## Authorization
Authorization is re-evaluated at commit for queued writes (CTR-CAP-001). A grant revoked while a write is queued causes denial at commit.

## Failure, idempotency, concurrency, offline
- **Timeouts:** command server-side budget 2 s (ASSUMPTION); client sees `SYS.UNAVAILABLE` on timeout and retries with the same key.
- **Retry policy:** client backoff with full jitter, base 500 ms, cap 60 s, honor `retry_after_ms` (CTR-ERR-001). Never retry non-retryable codes.
- **Race: accept vs expiry:** decided by commit order; loser gets `NEG.WINDOW_CLOSED` or `EVT.REVISION_CONFLICT`.
- **Race: accept vs listing edit:** accept reads listing version inside the commit transaction; mismatch → `NEG.LISTING_CHANGED`.
- **Race: two counters:** second gets `EVT.REVISION_CONFLICT`.
- **Offline device after negotiation expired:** queued accept fails with `NEG.WINDOW_CLOSED` at commit; no state change.
- **Schema MAJOR unknown on device:** queued write stays pending with "client upgrade required" (CTR-SCH-001 R06).

## Privacy, retention, abuse
Idempotency records hold no terms beyond the digest and result ID. Failure logs carry codes and request IDs only.

## Observability & budgets
`negotiation_idempotent_replays_total`, `negotiation_revision_conflicts_total`, `negotiation_timer_lag_seconds` (alert > 300 s). Recovery time after restart to accept new commands ≤ 60 s (ASSUMPTION).

## Tests
- TEST-PS-010-06-01 (unique): two concurrent opens for one pair → exactly one `negotiation.opened`; other returns `NEG.OPEN_EXISTS`.
- TEST-PS-010-06-02 (replay): each command replayed with same key produces one event.
- TEST-PS-010-06-03 (conflict): two accepts at same revision → one `negotiation.agreed`; other `EVT.REVISION_CONFLICT`.
- TEST-PS-010-06-04 (crash): kill between state write and event append → no state change without event; restart replays.
- TEST-PS-010-06-05 (timer catch-up): expiry worker paused for 1 h → all overdue negotiations expire once on resume.
- TEST-PS-010-06-06 (offline stale): queued accept after listing edit and after deadline → codes returned, nothing applied.

## Acceptance criteria
1. No duplicate active pair exists under concurrent load (TEST-PS-010-06-01).
2. Replay produces no second event (TEST-PS-010-06-02).
3. TEST-PS-010-06-01 through -06 pass.

## Assumptions & open decisions
- ASSUMPTION: 2 s command timeout, 7-day idempotency retention (CTR-EVT-001).
- PROVISIONAL (D08 default, unapproved): local pending queue until authenticated relay acknowledgment.
- OPEN: user-visible "not applied" copy (F14 review).
