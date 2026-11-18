# PS-060-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_private. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-ERR-001 (R03, offline), CTR-PRV-001 (RET-EPH), CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-060-06.R01 | Message commit and thread revision update are atomic with the event (transaction or outbox). | MVP |
| PS-060-06.R02 | Duplicate sends return the original `msg_id`; no duplicate message. | MVP |
| PS-060-06.R03 | Per-thread ordering by server `revision`; out-of-order device deliveries are re-sorted on read. | MVP |
| PS-060-06.R04 | Client retries only retryable codes, max 5 attempts, backoff with jitter; client timeout 5 s. | MVP |
| PS-060-06.R05 | Offline sends queued; ineligible at relay time → `not_applied` and kept visible to sender. | MVP |
| PS-060-06.R06 | Delivery to recipient device is at-least-once with client de-duplication by `msg_id`. | MVP |

## Data / schema
Idempotency record (7 days). Device queue entry: `client_msg_id`, `thread_id`, `body_digest`, `status`. Queue bodies encrypted on device and purged on ack (RET-EPH).

## Commands / queries / events
Retry rules apply to all send, contact and state commands.

## States & transitions
Device queue: `queued` → `sent` (server ack) or `not_applied`. `not_applied` items visible with reason; never silently dropped.

## Validation & errors
Non-retryable codes → `not_applied`.

## Authorization
Re-authorized server-side on each attempt.

## Failure, idempotency, concurrency, offline
- Crash between commit and relay push: push retried from outbox; recipient de-duplicates.
- Block during queue: queued items → `not_applied` with `NOT_ELIGIBLE` (identical text as non-eligible).
- Queue limits: 200 messages or 7 days per device (ASSUMPTION).
- Relay outage: send button remains available; sending state shown; no auto-resend after 7 days.

## Privacy, retention, abuse
Queued bodies deleted on logout, account switch and when `not_applied` is dismissed. Rate limit 60 messages per 10 minutes per sender (ASSUMPTION).

## Observability & budgets
`privmsg_outbox_lag_seconds` p95 ≤ 3 s; `privmsg_queue_not_applied_total{code}`. No content in metrics.

## Tests
- TEST-PS-060-06-01 (integration): crash after commit before push; exactly one delivered message per client.
- TEST-PS-060-06-02 (concurrency): block and send race; `not_applied` on loser.
- TEST-PS-060-06-03 (offline): 200-item queue cap enforced; 201st refused with user message.
- TEST-PS-060-06-04 (property): replays preserve per-thread order.

## Acceptance criteria
1. No duplicate messages under fault injection.
2. Ordering holds across devices.
3. No queued message disappears without a visible state.
4. Queue purged on logout.

## Assumptions & open decisions
- ASSUMPTION: queue cap 200 messages / 7 days; rate limit 60 per 10 minutes.
- PROVISIONAL (D08 default, unapproved): local pending queue until authenticated relay acknowledgment.
