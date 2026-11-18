# PS-013-06 — failure, recovery and idempotency
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_offer. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-013-06.R01 | Submit is atomic: revision insert, prior-revision supersede and event append commit together or not at all. | MVP |
| PS-013-06.R02 | Idempotency keys are retained 7 days (CTR-EVT-001 R03); replay returns the original response. | MVP |
| PS-013-06.R03 | Client retries only for retryable codes, max 3 attempts, backoff 1 s, 2 s, 4 s with ±20% jitter. | MVP |
| PS-013-06.R04 | Offline drafts queue locally, max 50 offers, until relay acknowledgment (D08 PROVISIONAL). | MVP |

## Data / schema
Recovery uses `ofr_id`, `revision_no`, `idempotency_key`, `content_digest` (PS-013-01). No additional tables.

## Commands / queries / events
Server timeout for submit 2 s; client timeout 5 s. Timeout after commit is resolved by replaying the same key.

## States & transitions
Crash before commit: no state change. Crash after commit before response: client replays key, receives original result.

## Validation & errors
`OFFER.REVISION_CONFLICT` (retryable after refresh of `revision_no`). `OFFER.QUOTE_STALE` (retryable after re-fetch). `OFFER.LISTING_UNAVAILABLE` (not retryable).

## Authorization
Replays re-authorize against current state; a withdrawn slot cannot submit even with a valid old key.

## Failure, idempotency, concurrency, offline
Concurrent submits on one slot: row lock on the slot's current revision; loser gets `OFFER.REVISION_CONFLICT`. Lock vs submit race: lock wins if committed first, then submit returns `OFFER.ILLEGAL_TRANSITION`. Offline queue is ordered per slot; a queued submit with stale `expected_revision` is rejected and kept for user review, not auto-merged.

## Privacy, retention, abuse
Queued local drafts are encrypted at rest on the device (ASSUMPTION) and deleted on acknowledgment or after 30 days.

## Observability & budgets
Metrics: retry count per code, replay count, queue depth p95 ≤ 5. Alert when conflict rate exceeds 2% for 15 minutes.

## Tests
- TEST-PS-013-06-01 (integration): fault injection after commit, before response; replay returns original.
- TEST-PS-013-06-02 (concurrency): 20 parallel submits on one slot yield one winner.
- TEST-PS-013-06-03 (offline): queue survives app restart; 51st draft is refused.

## Acceptance criteria
1. Zero duplicate `offer.submitted` events across 10,000 fault-injected replays.
2. No partial state after injected failure at each of the 4 write steps.

## Assumptions & open decisions
- ASSUMPTION: 7-day key retention is adequate for offline queues of ≤ 30 days; replays after 7 days return `SYS.IDEMPOTENCY_KEY_REUSED`.
- D08 PROVISIONAL (Dxx default, unapproved): local pending queue until authenticated acknowledgment.
