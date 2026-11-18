# PS-103-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_inapp. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03, R08), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-103-06.R01 | `ntf.create` is idempotent on (recipient, template, source); duplicates return the existing `ntf_` with no new event. | MVP |
| PS-103-06.R02 | Recipient operations are idempotent on (`acc_`, `op_id`). The server stores the response for 7 days (CTR-EVT-001 R03 scope). | MVP |
| PS-103-06.R03 | Producers that fail to create an item retry with backoff 1 s → 10 min cap (ASSUMPTION). A dead-letter queue holds items after 24 h of failure; the producer's owner is alerted. | MVP |
| PS-103-06.R04 | Sync is cursor-based on `inbox_revision`; a client never misses a change because the cursor is monotonic and the server returns `next_revision`. | MVP |
| PS-103-06.R05 | Monotonic rules (PS-103-03 R03) resolve concurrent read and dismiss from two devices. | MVP |

## Data / schema
Operation log per account: `(acc_, op_id, command, digest, response, created_at)`. Dead-letter rows: `source_ref`, `template_key`, `attempts`, `last_error_code`.

## Commands / queries / events
Create is a single transaction: insert `ntf_inapp`, assign `inbox_revision`, insert outbox event.

## States & transitions
Dead-letter items never reach `queued`; they are retried by the owner after fix, with the same dedupe key.

## Validation & errors
`INAPP.PARAM_INVALID` and similar are non-retryable at the producer; `SYS.UNAVAILABLE` retryable (shared code).

## Authorization
Re-evaluated on each retry.

## Failure, idempotency, concurrency, offline
- Offline: read and dismiss actions are stored in the PWA pending queue (D08) and flushed on reconnect with their `op_id`; the server returns the original response on duplicates.
- Multi-device: `inbox_revision` ordering; a read on device A appears on device B on next sync.
- Relay outage: the PWA shows the last synced list with a "last updated" time (no fabricated unread counts).
- Timeouts: list 2 s; mark_read 2 s; client retry max 5 attempts with jitter.

## Privacy, retention, abuse
Operation log rows store digests, not `params`. Dead-letter rows store template and source references only.

## Observability & budgets
Alerts: dead-letter rows older than 1 h (ticket) and > 1 000 in 10 min (page); duplicate-create rate spike (producer bug signal).

## Tests
- `TEST-PS-103-06-01` integration: producer retries after timeout → one `ntf_`.
- `TEST-PS-103-06-02` integration: duplicate `mark_read` with same `op_id` → same response.
- `TEST-PS-103-06-03` offline: queued read and dismiss flushed once after reconnect; state monotonic.
- `TEST-PS-103-06-04` integration: two devices read and dismiss concurrently → dismissed wins; no revert.

## Acceptance criteria
1. No duplicate items under producer retry tests.
2. Offline queue flushes without duplicate transitions.
3. Dead-letter alerts verified in drill.

## Assumptions & open decisions
- ASSUMPTION: 24 h dead-letter threshold and 7-day operation log are defaults for F13 review.
- D08 (PWA offline writes), PROVISIONAL default: pending queue until authenticated relay acknowledgement (unapproved).
