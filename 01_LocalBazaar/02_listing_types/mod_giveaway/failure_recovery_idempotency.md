# PS-005-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_giveaway. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 R02, R03, R08, R09; CTR-ERR-001 R03; CTR-SCH-001 R05–R06. PENDING CTR-LST-001 (F01 reserve/reopen idempotency).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-005-06.R01 | Idempotency scope = (actor, command, `idempotency_key`); same key and digest return original result; key reuse with different digest → `EVT.IDEMPOTENCY_KEY_REUSED`. Records kept 7 d. | MVP |
| PS-005-06.R02 | Accept race: exactly one claim becomes ACCEPTED per listing. Losing request returns `GIVE.LISTING_ALREADY_RESERVED` (409, not retryable). | MVP |
| PS-005-06.R03 | Reservation to F01 uses an outbox with at-least-once delivery, idempotent on `claim_id` + revision; lag p95 ≤ 60 s (ASSUMPTION). | MVP |
| PS-005-06.R04 | Offline submit/withdraw/confirm queued locally until server acknowledgment (D08). UI shows "pending", never "claimed". | MVP |
| PS-005-06.R05 | Replayed offline command after listing reserved resolves as `GIVE.LISTING_NOT_CLAIMABLE`; queue entry marked resolved, not retried. | MVP |
| PS-005-06.R06 | Server timeouts: client waits ≤ 10 s, then shows pending; server commits atomically or not at all. | MVP |
| PS-005-06.R07 | Partial failure (claim committed, F01 reserve failed): claim stays ACCEPTED, outbox retries; no duplicate ACCEPTED. | MVP |

## Data / schema
Idempotency table: `(actor_ref, command, idempotency_key)` → `request_digest`, `result_revision`, `expires_at` (RET-OPS, 7 d). Outbox table: `claim_id`, `target_command`, `revision`, `attempts`, `next_at`.

## Commands / queries / events
Idempotency applies to all commands in [commands_queries_events](commands_queries_events.md).

## States & transitions
Recovery moves: outbox failure after ACCEPTED does not roll back ACCEPTED. If reserve is permanently impossible (listing deleted), claim moves to REJECTED (LISTING_ENDED) via compensating command.

## Validation & errors
Retryable: `SYS.UNAVAILABLE` (503, true), `EVT.REVISION_GAP` (true). Not retryable: `GIVE.LISTING_ALREADY_RESERVED`, `GIVE.INVALID_TRANSITION`, `EVT.IDEMPOTENCY_KEY_REUSED`.

## Authorization
Replays are re-authorized at server receipt using current state; a stale grant does not authorize a replayed write.

## Failure, idempotency, concurrency, offline
- Concurrency: `expected_revision` check; mismatch → `EVT.REVISION_CONFLICT` (client reloads).
- Offline: pending queue (D08 PROVISIONAL default, unapproved); queue never discarded on unknown MAJOR (CTR-SCH R06).
- Retry: exponential backoff with jitter, max 8 attempts for outbox; client max 5 attempts (ASSUMPTION).

## Privacy, retention, abuse
Queue and outbox hold only ids, digests and timestamps. Retention RET-OPS.

## Observability & performance
Metrics: `giveaway_outbox_lag_seconds`, `giveaway_idempotency_replays_total`, `giveaway_accept_race_losses_total`. Alert when outbox lag p95 > 60 s.

## Tests
- TEST-PS-005-06-01: 50 concurrent accepts on one listing yield one ACCEPTED.
- TEST-PS-005-06-02: duplicate submit with same key returns original; different digest returns reuse error.
- TEST-PS-005-06-03: F01 reserve failure, then recovery, produces no duplicate reservation.
- TEST-PS-005-06-04: offline queued submit replayed after reserve resolves as not claimable.

## Acceptance criteria
1. No state where two claims are ACCEPTED or later for one listing, including after partial failure.
2. Every retry path is idempotent and bounded.
3. Pending offline items are never displayed as final.

**Assumptions and open decisions:** Retry counts and lag budgets are ASSUMPTION. D08 (PROVISIONAL default: local pending queue until authenticated relay acknowledgment, unapproved) applies. D04 (PROVISIONAL default: per-party attestation with compensating recovery, unapproved) applies to handover recovery. See [DECISIONS.md](../../../DECISIONS.md).
