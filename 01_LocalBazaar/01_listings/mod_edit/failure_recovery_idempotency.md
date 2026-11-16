# PS-003-06 — failure, recovery, idempotency and offline

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_edit. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 R02–R04 (revision, idempotency, timestamps), CTR-ERR-001 R03 (retryable), CTR-SCH-001.

**Decision labels:** Offline pending queue PROVISIONAL (D08 default, unapproved). Timeouts and retry counts are ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-003-06.R01 | Field writes, `revision` increment and the `listing.updated` outbox row commit in one transaction. No event exists without a committed revision. | MVP |
| PS-003-06.R02 | Replay of `listing.edit` with same key and digest returns the original response and `revision`, and writes no new outbox row. | MVP |
| PS-003-06.R03 | On `EVT.REVISION_CONFLICT` the server applies nothing. No automatic merge. Client must reload via `listing.get_for_edit`. | MVP |
| PS-003-06.R04 | Offline edits are stored in a local pending queue with the `expected_revision` captured at local edit time. Each queued edit shows "not yet saved" until acknowledged (D08). | MVP |
| PS-003-06.R05 | Last-writer-wins is forbidden for listing fields. Queued edits that conflict are shown to the owner side by side for manual re-apply. | MVP |
| PS-003-06.R06 | Client timeout 10 s; server budget 5 s. Client retries with the same key: up to 5 attempts, backoff 1, 2, 4, 8, 16 s (ASSUMPTION). | MVP |
| PS-003-06.R07 | Outbox dispatch retries with exponential backoff up to 24 h, then dead-letters and alerts F15 Platform. | MVP |
| PS-003-06.R08 | Moderation re-screen failure does not roll back an accepted edit. The re-screen job retries; the listing stays `published` until a flag moves it to `hidden` (ASSUMPTION). | MVP |

## Data / schema
Idempotency record: `(actor_ref, command_type, idempotency_key, request_digest, response, created_at)`. Retention RET-OPS, 7 days (CTR-EVT-001 R03). Offline queue item: `(client_queue_id, listing_id, expected_revision, changes, status)`, kept on device only.

## Commands / queries / events
Retries use [commands_queries_events.md](commands_queries_events.md) contracts unchanged.

## States & transitions
Queue item states: `pending` → `acknowledged` | `conflict` | `rejected`. `rejected` covers `EDIT.STATE_NOT_EDITABLE`, `EDIT.FIELD_NOT_EDITABLE`, and `EDIT.MATERIAL_CHANGE_BLOCKED`. Terminal states are not retried.

## Validation & errors
Retryable only for `SYS.UNAVAILABLE`, `SYS.RATE_LIMITED` (after the window) and `SYS.INTERNAL` if registered retryable. Others are not retried (CTR-ERR-001 R03).

## Authorization
Queued edits are re-authorized at commit. Revocation makes them fail (CTR-CAP-001 revocation propagation).

## Failure, idempotency, concurrency, offline
See Requirements R01–R08 above; this file is the authoritative source for the topic.

## Privacy, retention, abuse
Offline queue lives on the owner's device only. Queue cleared on logout. See [privacy_retention_abuse.md](privacy_retention_abuse.md).

## Observability & budgets
Queue depth, conflict rate and retry count per outcome. See [observability_performance.md](observability_performance.md).

## Tests
- TEST-PS-003-06-01 (integration): crash after commit before response → retry returns original response, one outbox row.
- TEST-PS-003-06-02 (concurrency): two devices edit same revision → one `acknowledged`, one `conflict`; no silent overwrite.
- TEST-PS-003-06-03 (offline): edit queued offline, listing archived meanwhile → `rejected` with `EDIT.STATE_NOT_EDITABLE` on reconnect.
- TEST-PS-003-06-04 (failure): outbox dispatch outage 30 min → events delivered once, in revision order.

## Acceptance criteria
1. No state exists where a revision is committed without its outbox row, or the reverse.
2. No queued listing edit is silently overwritten.
3. Replay and conflict tests pass with zero duplicate events.

## Assumptions & open decisions
- D08 (PROVISIONAL, Dxx default, unapproved): local pending queue until authenticated relay acknowledgment.
- ASSUMPTION: retry counts and backoff values above.
- ASSUMPTION: re-screen failure does not roll back edits.
