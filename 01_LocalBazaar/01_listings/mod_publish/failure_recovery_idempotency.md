# PS-004-06 — failure, recovery and idempotency
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_publish. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (atomic commit, idempotency R03, offline replay), CTR-ERR-001 (retry rules), CTR-CAP-001 (fail-closed decisions). **Pending:** PENDING CTR-MOD-001 (risk verdict interface; F12).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-004-06.R01 | Publish commit is atomic: revision check, state write, event append and hash-chain update in one transaction. | MVP |
| PS-004-06.R02 | Idempotency scope (actor, `lst.publish`, key), retained 7 days. Same digest replays the original result. | MVP |
| PS-004-06.R03 | Risk call and PII scan run before commit, outside the transaction, with a 300 ms timeout (ASSUMPTION). Timeout → T2. | MVP |
| PS-004-06.R04 | Discovery index update runs from a transactional outbox, at-least-once, outside the publish transaction. | MVP |
| PS-004-06.R05 | Offline publish is re-checked at server commit against current state and revision. Failure → non-retryable "not applied" (D08). | MVP |
| PS-004-06.R06 | Wrong publications are corrected by new events (archive or hold). No event is deleted or edited (CTR-EVT R08). | MVP |

## Failure table
| Scenario | Behaviour | Client action | User outcome |
|---|---|---|---|
| Commit fails | Rollback; no event, no revision change | Retry same key (backoff 500 ms base, 60 s cap) | SYS.UNAVAILABLE, retryable |
| Response lost after commit | Replay returns original result | Retry same key | Same state; no second event |
| Two devices, same revision | One commit; other gets EVT.REVISION_CONFLICT | Reload state, then decide | "Changed elsewhere" message |
| Risk timeout (300 ms) | Fail closed: T2 with `risk_review` | None | "Under review" |
| Media scan pending | No write; PUB.MEDIA_SCAN_PENDING | Retry after scan, honor retry_after | "Waiting for image check" |
| Outbox or index down | Commit succeeds; events queued; index lag | Outbox redelivers; consumers dedupe on `event_id` | Published; search may lag |
| Offline replay after hold | Commit check fails | Queue entry marked "not applied" | Message key `err.pub.hold_active` |
| Client clock skew | Server sets `published_at` and `expires_at`; client `occurred_at` is not used for expiry | None | None |

## Recovery
- Outbox rows purged on acknowledgment (RET-EPH, CTR-PRV-001). Unacknowledged rows older than 24 h raise an alert (ASSUMPTION).
- Recovery replays are safe: consumers and the discovery index dedupe on `event_id`.
- Corrections use mod_archive or a hold. Publish is never rolled back by deletion.

## Concurrency
Optimistic revision check. Locks are not held across the risk call. Exactly one publish commits per revision.

## Timeouts and budgets
- API request timeout 3 s (ASSUMPTION). Risk call 300 ms. Media status read 2 s, then PUB.MEDIA_SCAN_PENDING.
- Commit p95 ≤ 150 ms (CTR-EVT-001).

## Assumptions & open decisions
- ASSUMPTION: fail-closed on risk timeout; fail-open would publish unscreened content.
- PROVISIONAL (D08 default, unapproved): local pending queue until authenticated relay acknowledgment.
- Related: PS-004-03 (T2 guard), PS-004-10 (rollback and backup).

## Tests
- TEST-PS-004-06-01 (integration): injected failure at each step of the commit leaves state, revision and events unchanged.
- TEST-PS-004-06-02 (idempotency): replay after lost response returns the same `event_id` (CTR-EVT TEST-04).
- TEST-PS-004-06-03 (fault): risk service timeout produces T2 in 100% of 1000 runs.
- TEST-PS-004-06-04 (offline): queued publish replayed after hold placed → "not applied", no state change.
- TEST-PS-004-06-05 (outbox): index down for 10 min, then restored; every `listing.published` is indexed once.

## Acceptance criteria
1. TEST-PS-004-06-01 to -05 pass in CI.
2. No publish path returns T1 when the risk verdict is missing or timed out.
3. No code path deletes or edits a stored event.
