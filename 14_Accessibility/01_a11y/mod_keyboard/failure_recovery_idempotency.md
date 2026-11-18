# PS-109-06 — failure recovery and idempotency

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-109-06. **Owner:** [14_Accessibility/01_a11y/mod_keyboard](SPEC.md). **Implementing module:** 14_Accessibility/01_a11y/mod_keyboard. **Consumers:** F15 (outbox, retries, error envelope CTR-ERR-001), F07 (cascade delivery), F10 (hard-delete job), F16 (rate limiting); client keyboard runtime (offline queue).

## Purpose and scope
Define retry, timeout, idempotency, concurrency-conflict and partial-failure behavior for keyboard preference writes between device, relay and storage. Covers the device queue (D08 default: queue until server acknowledgment).

**Business outcome:** a user's change is applied at most once, is never reported as saved before the server acknowledges it, and survives crashes, lost responses and short outages.

**Exclusions:** no cross-device conflict merging (users choose, PS-109-03); no guarantee of delivery to external systems; no retry of non-retryable validation errors.

## Requirements
- **PS-109-06.R01** — Outcome: at-most-once effect per user action (idempotency key) and at-least-once event emission (outbox, consumers dedupe by `event_id`).
- **PS-109-06.R02** — Cases: normal (write acked first try); invalid (non-retryable, stop); expired (queued write older than 7 days, ABANDONED); duplicate (same key replayed after lost response); concurrent (two devices, stale `expected_revision`; same key in flight twice); offline (queue, reconnect); adversarial (key reuse with different payload; flood of writes; crafted replay after 24 h window).
- **PS-109-06.R03** — Client retry policy: retry only `retryable: true` codes and network errors. Exponential backoff base 1 s, factor 2, jitter ±20%, cap 30 s, maximum 6 attempts per queued write. `KEYBOARD_RATE_LIMITED` waits `retry_after_ms`. After 3 consecutive `KEYBOARD_BACKEND_UNAVAILABLE` or `KEYBOARD_TIMEOUT` results, the device pauses flushing for 60 s (circuit pause).
- **PS-109-06.R04** — Timeouts: client request 5 s for commands and 3 s for queries; server transaction 5 s for commands and 3 s for queries; outbox publish attempt 1 s. A server transaction exceeding its budget is rolled back and returns `KEYBOARD_TIMEOUT`.
- **PS-109-06.R05** — Idempotency records: key, payload hash (SHA-256 of canonical JSON), state (`in_progress`, `done`), stored response, created_at; retained 24 h. Insert of the key record happens in the same transaction as the write. Same key and hash while `done`: return stored response with `replayed: true`. Same key while `in_progress` and younger than 5 s: return `KEYBOARD_IDEMPOTENCY_IN_PROGRESS` (409, retryable after 1 s). Same key with different hash: `KEYBOARD_IDEMPOTENCY_KEY_REUSED`. A key record found `in_progress` older than 5 s is treated as abandoned and its transaction is already rolled back, so the request is re-executed.
- **PS-109-06.R06** — Concurrency: each write runs in one transaction that locks the profile row, compares `revision` to `expected_revision`, and on mismatch returns `KEYBOARD_REVISION_CONFLICT` with `current_revision` and no state change. Two concurrent writes with the same revision: exactly one commits.
- **PS-109-06.R07** — Partial failure: profile row, revision row, idempotency record and outbox row commit together or not at all. If the commit succeeds but the response is lost, the client retry replays the stored response (R05). If the outbox publish fails, the profile stays committed; the outbox retries with backoff for up to 72 hours, then raises an operator alert with `event_id` only.
- **PS-109-06.R08** — Device recovery: the queue lives in IndexedDB with fields `queue_seq`, `idempotency_key`, `expected_revision`, `patch`, `enqueued_at`, `attempts`. On app start, an item left `IN_FLIGHT` is reset to `PENDING` with the same key. Queue order is preserved; items are sent one at a time per profile.
- **PS-109-06.R09** — Queue limits: maximum 50 queued writes (A-KBD-06); a 51st local edit is refused with `KEYBOARD_QUEUE_FULL` (client-only) and nothing is changed; queued writes older than 7 days move to ABANDONED with `KEYBOARD_PENDING_EXPIRED` (client-only), and the user is told in a keyboard-reachable notice.
- **PS-109-06.R10** — Rate limits (A-KBD-15): 30 writes per minute and 120 reads per minute per account. Exceeding returns `KEYBOARD_RATE_LIMITED`; limited responses do not consume idempotency records.

## Recovery matrix
| Failure | Server behavior | Device behavior | Recovery |
|---|---|---|---|
| Network drop before send | none | item stays PENDING | flush on reconnect |
| Network drop after send, before response | may have committed | item to PENDING, same key | replay returns stored response |
| 409 revision conflict | no change | CONFLICTED | user reapply or discard (PS-109-03) |
| 422 key reused | no change | item ABANDONED (client bug path, logged with request_id) | none; new action creates new key |
| 503 or 504 | rollback | retry with backoff; circuit pause after 3 | auto after backoff |
| 429 | no record consumed | wait `retry_after_ms` | auto |
| Crash mid-flush | unknown | IN_FLIGHT reset to PENDING on start | replay with same key |
| Outbox publish failure | profile committed | none | outbox retry up to 72 h |
| F07 cascade delivered twice | second run no-op (tombstone exists) | none | idempotent by account_id |
| Hard-delete job failure | tombstone remains, no personal content | none | daily retry; alert after 3 failures |

## Open decisions
- A-KBD-06 (queue 7 days, 50 items), A-KBD-13 (timeouts), A-KBD-15 (rate limits). D08 (offline writes) and D04 (partial execution, not applicable here beyond single-profile atomicity) remain OPEN at program level. Retry numbers are recommended defaults, not measured values.

## Acceptance criteria
- Each row of the recovery matrix has a test in PS-109-09 with a fixed fault injection.
- A replayed write after a dropped response produces exactly one revision (test T-REPLAY).
- No failure path returns success to the user before server acknowledgment.
