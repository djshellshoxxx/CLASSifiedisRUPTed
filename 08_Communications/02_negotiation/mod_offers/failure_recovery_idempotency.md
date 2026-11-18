# PS-063-06 — failure recovery idempotency
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/02_negotiation/mod_offers. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-COM-001 (R04 quote expiry), CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-063-06.R01 | Duplicate `ofr.create` or `ofr.accept` with the same key and digest returns the original result. | MVP |
| PS-063-06.R02 | Accept after expiry is rejected even if the client's offline clock says valid. Server time governs. | MVP |
| PS-063-06.R03 | Offline-queued counters and accepts are re-validated at commit; stale ones rejected, never rebased (D08). | MVP |
| PS-063-06.R04 | Client retry: backoff base 1 s, cap 60 s, max 8 attempts; server timeout 2 s. | MVP |
| PS-063-06.R05 | Offer creation and its event commit in one transaction. | MVP |

## Data / schema
Idempotency record per CTR-EVT-001 R03, 7-day retention.

## Commands / queries / events
No new commands.

## States & transitions
Offline queue item: `queued` → `committed` | `rejected` (stale, expired, withdrawn) | `expired_local` (> 7 days).

## Validation & errors
| Code | Retryable | Category / HTTP | Note |
|---|---|---|---|
| OFFERS.EXPIRED | false | gone / 410 | Accept or counter past `expires_at`. |
| OFFERS.STALE_VERSION | false | conflict / 409 | Terms digest or version changed. |
| EVT.REVISION_CONFLICT | false | conflict / 409 | Concurrent write. |
| SYS.UNAVAILABLE | true | unavailable / 503 | `retry_after_ms`. |

## Authorization
Re-run at commit ([PS-063-05](authorization_capabilities.md)).

## Failure, idempotency, concurrency, offline
Expiry job failure: accepts still checked against `expires_at` at commit, so job lag cannot extend validity. Counter and accept race: loser re-reads. Partial failure after commit: retry returns original.

## Privacy, retention, abuse
Queued items hold IDs and digests only; cleared on logout (RET-EPH).

## Observability & budgets
`offers_queue_rejected_total{reason}`; alert if accepts committed after expiry (should be zero).

## Tests
- TEST-PS-063-06-01 (integration): duplicate accept → one event.
- TEST-PS-063-06-02 (offline): device clock set 10 days ahead, accept queued after server expiry → rejected by server.
- TEST-PS-063-06-03 (concurrency): counter and accept on same version → exactly one wins.
- TEST-PS-063-06-04 (offline): queued counter after recipient withdrew → `OFFERS.STATE_FORBIDS`.

## Acceptance criteria
1. No accept committed after server-side expiry (TEST-PS-063-06-02).
2. No duplicate offer events under retry (TEST-PS-063-06-01).

## Assumptions & open decisions
- D08 (PWA offline writes): PROVISIONAL (D08 default, unapproved).
- ASSUMPTION: client clock is never authoritative.
