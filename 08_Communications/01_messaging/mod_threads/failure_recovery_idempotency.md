# PS-061-06 — failure recovery idempotency
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_threads. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02 revision, R03 idempotency), CTR-ERR-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-061-06.R01 | A committed `msg.send` is never duplicated on client retry with the same `idempotency_key` and same digest. | MVP |
| PS-061-06.R02 | Attachment uploads are two-phase: `att.init` (pending row, expiry 1 h), upload, `att.complete`. Pending rows past expiry are purged to `orphaned` then deleted. | MVP |
| PS-061-06.R03 | A message commits only if every referenced attachment is `stored`. Otherwise the whole send fails with no partial message. | MVP |
| PS-061-06.R04 | Client retry policy: exponential backoff with full jitter, base 1 s, cap 60 s, max 8 attempts; per-request timeout 5 s. | MVP |
| PS-061-06.R05 | Offline `pending_local` queue: ≤ 200 messages and ≤ 7 days, flushed in order on reconnect (D08 default). | MVP |
| PS-061-06.R06 | Concurrent writers on one thread use `expected_revision`; mismatch returns `EVT.REVISION_CONFLICT` and the client re-reads before retry. | MVP |

## Data / schema
Idempotency record: (`actor`, `cmd`, `idempotency_key`, `digest`, `result_ref`, `created_at`); retained 7 days (CTR-EVT-001 R03).

## Commands / queries / events
No new commands. Recovery actions emit `attachment.rejected` for orphaned rows where a `correlation_id` exists.

## States & transitions
Attachment: `pending` → `stored` (complete with verified digest) | `rejected` (type or size failure) | `orphaned` (expiry). `orphaned` → deleted after 24 h. Message commit does not change attachment state other than binding.

## Validation & errors
| Code | Retryable | Category / HTTP | Note |
|---|---|---|---|
| EVT.REVISION_CONFLICT | false | conflict / 409 | Re-read then retry (owned by CTR-EVT-001). |
| EVT.IDEMPOTENCY_KEY_REUSED | false | conflict / 409 | Same key, different digest. |
| THREADS.UPLOAD_EXPIRED | false | gone / 410 | `att.complete` after expiry. |
| SYS.UNAVAILABLE | true | unavailable / 503 | `retry_after_ms` included. |

## Authorization
Retries re-run authorization at commit ([PS-061-05](authorization_capabilities.md)). A retry after participant removal fails.

## Failure, idempotency, concurrency, offline
Timeouts: server commit 2 s, attachment storage write 10 s (ASSUMPTION). Partial failure after event append but before response: client retry returns original result via idempotency record. Event append and idempotency record written in one transaction. Offline: queued sends keep their keys; any queued item beyond 7 days is dropped client-side with a visible notice.

## Privacy, retention, abuse
Pending attachment bytes are RET-EPH; orphaned bytes purged within 24 h. Idempotency records follow RET-OPS (7 days).

## Observability & budgets
Metrics: `threads_idempotent_replay_total`, `threads_upload_orphaned_total`, `threads_queue_depth{client_bucket}`. Alert if orphan rate > 1% of uploads per day (ASSUMPTION).

## Tests
- TEST-PS-061-06-01 (integration): retry after timeout with same key → one message, one event.
- TEST-PS-061-06-02 (integration): one attachment `rejected` in a batch → no message row; no partial event.
- TEST-PS-061-06-03 (integration): `att.complete` after 1 h → `THREADS.UPLOAD_EXPIRED`; orphan purged.
- TEST-PS-061-06-04 (offline): 200 queued messages flush in order after 6 h offline; 201st rejected at queue time.
- TEST-PS-061-06-05 (concurrency): two clients send with same `expected_revision`; exactly one commits.

## Acceptance criteria
1. No duplicate events under retry (TEST-PS-061-06-01).
2. No partial message under attachment failure (TEST-PS-061-06-02).

## Assumptions & open decisions
- ASSUMPTION: 1 h upload window; 24 h orphan deletion.
- D08 (PWA offline writes): PROVISIONAL (D08 default, unapproved) — local pending queue until authenticated relay acknowledgment.
