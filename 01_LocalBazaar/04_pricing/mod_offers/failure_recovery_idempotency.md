# PS-011-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/04_pricing/mod_offers. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (idempotency R03, revision R02, atomic commit), CTR-ERR-001 (retry rules), CTR-SCH-001, CTR-COM-001 (quote expiry), CTR-ID-001 (client-generated IDs).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-011-06.R01 | Same (actor, command, idempotency_key) with same request digest returns the original result and creates no event. Window 7 days. | MVP |
| PS-011-06.R02 | Same key with different digest → EVT.IDEMPOTENCY_KEY_REUSED. | MVP |
| PS-011-06.R03 | Concurrent transitions on one offer: exactly one commits per revision. Others get EVT.REVISION_CONFLICT. | MVP |
| PS-011-06.R04 | Offline submit is a local draft with status "pending" until server acknowledgement (D08). No local accept or reject. | MVP |
| PS-011-06.R05 | Expiry is evaluated against server time at commit. The sweep is idempotent and may lag; reads and commits apply expiry lazily. | MVP |
| PS-011-06.R06 | Non-retryable error on replay moves the draft to "not applied" with its message_key. Never discarded or retried automatically. | MVP |
| PS-011-06.R07 | Client request timeout 5 s (ASSUMPTION). Retries reuse the same key; backoff base 500 ms, cap 60 s, full jitter; honor retry_after_ms. | MVP |
| PS-011-06.R08 | An accepted offer is never rolled back by a failed supersede step. Supersede retries until done; the listing is no longer open after accept, so further accepts fail with OFFER.LISTING_NOT_OPEN. | MVP |

## Data / schema
Idempotency records: key, actor, command, digest, result reference, created_at (RET-OPS, 7 days). Client drafts: local record with client-generated offer_id, status pending, queued_at. Drafts exist only on the device.

## Commands / queries / events
Retry-safe: offer.submit, withdraw, accept, reject, expire. Expire is a no-op on terminal offers.

## States & transitions
Failure does not add states. A draft is `pending` (client), then `submitted` (server) or `not applied` (client, terminal).

## Validation & errors
Non-retryable codes from PS-011-02 and PS-011-04. Retryable: SYS.UNAVAILABLE, SYS.RATE_LIMITED, SYS.PRECONDITION_FAILED.

## Authorization
Re-check at commit for queued writes (CTR-CAP-001). A withdrawn buyer or revoked grant fails at commit.

## Failure, idempotency, concurrency, offline
| Scenario | Behavior |
|---|---|
| Server commits, response lost | Client retries with same key, receives original offer. |
| Commit fails | Nothing stored (atomic per aggregate). Client retries with same key. |
| Accept commits, supersede partially fails | Accept stands; supersede saga retried with the same correlation_id; events may lag. |
| Offline for days | Draft queued; expires at server time, so a late submit may be refused with OFFER.EXPIRY_INVALID or OFFER.LISTING_NOT_OPEN. |
| Schema version unknown to client | Draft stays pending and is marked "client upgrade required" (CTR-SCH-001 R06). |
| Idempotency record expired (after 7 days) | Replay is treated as new; the duplicate guard (single_active) still applies. |

## Privacy, retention, abuse
Idempotency keys are random per draft; they carry no user data. Draft queue purged on logout and account switch (CTR-PRV-001).

## Observability & budgets
Metrics: `offer_idempotent_replays_total`, `offer_revision_conflicts_total`, `offer_draft_not_applied_total`. Queue size per device ≤ 20 pending drafts (ASSUMPTION).

## Tests
- TEST-PS-011-06-01 (idempotency): repeat submit returns the same offer_id and creates one event.
- TEST-PS-011-06-02 (digest): same key, changed amount → EVT.IDEMPOTENCY_KEY_REUSED.
- TEST-PS-011-06-03 (race): 50 parallel accept/withdraw/reject calls: exactly one commit.
- TEST-PS-011-06-04 (offline): airplane-mode submit shows pending, reconnect submits once, UI never shows "submitted" before ack.
- TEST-PS-011-06-05 (partial failure): injected failure after accept commit; supersede completes on retry; accept not reverted.
- TEST-PS-011-06-06 (retry schedule): backoff intervals and retry_after_ms honored; key unchanged across retries.

## Acceptance criteria
1. No duplicate offers from replays in fault-injection runs.
2. Concurrency test yields exactly one commit per revision.
3. TEST-PS-011-06-01 through -06 pass in CI.

## Assumptions & open decisions
- PROVISIONAL (D08 default, unapproved): pending until authenticated relay acknowledgement.
- ASSUMPTION: 5 s client timeout; 7-day idempotency window.
- PENDING F01 listing-state contract for "no longer open after accept".
