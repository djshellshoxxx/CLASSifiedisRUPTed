# PS-116-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_offline (F15.S01.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-116-06.R01 | Retry backoff: full jitter, base 500 ms, cap 60 s (CTR-ERR-001). Same `idempotency_key` on every retry. | MVP |
| PS-116-06.R02 | Request timeout 15 s per send; a timeout is treated as unknown outcome and retried with the same key. | MVP |
| PS-116-06.R03 | Retryable codes return to `queued`; non-retryable codes move to `not_applied`. Unknown codes are non-retryable (CTR-ERR-001). | MVP |
| PS-116-06.R04 | Entries older than 30 days in `queued` or `upgrade_required` are moved to `not_applied` with `OFFLINE.ENTRY_EXPIRED` and shown to the user. | MVP |
| PS-116-06.R05 | Crash recovery: on start, entries in `sending` return to `queued` before replay. | MVP |
| PS-116-06.R06 | Storage corruption (digest mismatch) quarantines the entry as `not_applied` with `OFFLINE.ENTRY_TAMPERED`; the rest of the queue continues. | MVP |
| PS-116-06.R07 | Server idempotency window 7 days (CTR-EVT-001 R03). Replays after that window are refused by the server and reported as `not_applied`. | MVP |

## Data / schema
Retry fields: `attempts`, `next_attempt_at` (PS-116-01). Maximum 50 attempts, then `not_applied` with `OFFLINE.RETRY_EXHAUSTED` (ASSUMPTION).

## Commands / queries / events
Retries are issued by `offline.replay`; no separate retry command.

## States & transitions
Transitions per PS-116-03. Crash recovery is `sending -> queued` (R05).

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| OFFLINE.RETRY_EXHAUSTED | false | unprocessable_state / 422 | 50 attempts reached. |
| OFFLINE.ENTRY_EXPIRED | false | gone / 410 | Older than 30 days. |
| OFFLINE.ENTRY_TAMPERED | false | internal / 500 | Digest mismatch. |

## Authorization
Retries use the current session (PS-116-05).

## Failure, idempotency, concurrency, offline
Idempotency is the key pair in PS-116-01 R02. Concurrency: one sender per account per device (writer lock). If the device is offline, nothing is sent; no timer produces `applied`.

## Privacy, retention, abuse
Expired entries are purged as in PS-116-07. A device that replays thousands of entries is rate-limited by the server (`SYS.RATE_LIMITED`, retryable with `retry_after_ms`).

## Observability & budgets
Metrics: `offline_retries_total{code}`, `offline_exhausted_total`. Alert when exhausted entries exceed 1% of enqueues in 24 h (ASSUMPTION).

## Tests
- TEST-PS-116-06-01 (unit): backoff schedule with full jitter stays within [0, cap].
- TEST-PS-116-06-02 (integration): kill process during `sending`; restart returns entry to `queued`; server commits once.
- TEST-PS-116-06-03 (property): random error sequences never produce `applied` without `server_ref`.
- TEST-PS-116-06-04 (unit): digest mismatch quarantines one entry, others replay.

## Acceptance criteria
1. Retry, timeout and expiry values match this file.
2. TEST-PS-116-06-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 15 s timeout, 50 attempts, 30-day expiry.
- PROVISIONAL (D08 default, unapproved).
