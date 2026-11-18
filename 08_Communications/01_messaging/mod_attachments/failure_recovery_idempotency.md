# PS-059-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_attachments. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-ERR-001 (R03, offline), CTR-PRV-001 (RET-EPH), CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-059-06.R01 | Chunk writes are idempotent per `(att_id, chunk_index)` with hash check. | MVP |
| PS-059-06.R02 | Commit of an attachment and its event is atomic (transaction or outbox). | MVP |
| PS-059-06.R03 | Storage failure during chunk write leaves upload resumable; no partial blob served. | MVP |
| PS-059-06.R04 | Scanner failure never produces `passed`; retry up to 3 times then `rejected`. | MVP |
| PS-059-06.R05 | Client retries only retryable codes, max 5 attempts, backoff with jitter. | MVP |
| PS-059-06.R06 | Message commit referencing an attachment that is not `available` fails with `ATTACH.NOT_AVAILABLE`; message not committed. | MVP |

## Data / schema
Chunk table: `att_id`, `chunk_index`, `chunk_sha256`, `stored_at`. Purged with upload. Offline pending item: `draft_att_id`, `chunk_count`, `status`, purged on ack (RET-EPH).

## Commands / queries / events
Retry rules apply to all commands in [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Client queue states: `pending` → `acknowledged` | `not_applied`. `not_applied` items keep the draft visible until the user dismisses (never silently discarded).

## Validation & errors
Non-retryable codes move offline items to `not_applied` with `message_key`.

## Authorization
Re-authorized per chunk and per completion.

## Failure, idempotency, concurrency, offline
- Crash mid-upload: resume from last committed chunk.
- Concurrent `CompleteUpload` calls: first wins; second returns current state.
- Offline queue limit: 25 MiB and 20 attachments per device, then new uploads blocked with user message (ASSUMPTION).

## Privacy, retention, abuse
Abandoned chunks deleted after 1 h (PS-059-03 R05). Device drafts purged at logout and account switch.

## Observability & budgets
`attach_upload_resume_total`; `attach_scan_lag_seconds` p95 ≤ 30 s.

## Tests
- TEST-PS-059-06-01 (integration): kill during chunk 3 of 5; resume completes with correct hash.
- TEST-PS-059-06-02 (fault): scanner down; never `available`.
- TEST-PS-059-06-03 (offline): queued upload when thread closed → `not_applied`.
- TEST-PS-059-06-04 (concurrency): double commit yields one `attachment.uploaded` event.

## Acceptance criteria
1. Resume correct under fault injection.
2. No partial or unscanned blob served.
3. Offline items never silently dropped.
4. One event per commit.

## Assumptions & open decisions
- ASSUMPTION: device queue limit 25 MiB / 20 attachments.
- PROVISIONAL (D08 default, unapproved): local pending queue until authenticated relay acknowledgment.
