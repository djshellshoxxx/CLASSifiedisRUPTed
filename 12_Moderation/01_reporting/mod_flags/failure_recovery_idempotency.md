# PS-094-06 — failure, recovery, idempotency and offline

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_flags (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-094-06.R01 | A double tap or retry of the same report submit creates exactly one `rpt_` (dedupe_hmac + idempotency_key). | MVP |
| PS-094-06.R02 | Reports queued offline keep their detail text encrypted on device, sent only after server ack (D08). | MVP |
| PS-094-06.R03 | Threshold counters are idempotent per report_id and converge within 60 s. | MVP |
| PS-094-06.R04 | Evidence referenced at submit must exist as `captured` (PS-093); otherwise submit fails with `EVD.CAPTURE_EXPIRED` or is retried after capture completes. | MVP |
| PS-094-06.R05 | Target deletion after submit does not invalidate the report; snapshot in `mev_` carries the content. | MVP |

## Retry and timeouts
| Path | Timeout | Retry | Terminal |
|---|---|---|---|
| report.submit | 5 s | client, same key, max 5, backoff 500 ms base | none |
| evidence precheck | 2 s | server, 2 attempts | `EVD.SCANNER_UNAVAILABLE` (retryable) |
| threshold counter | 1 s | async, at-least-once with dedupe | alert on lag > 60 s |

## Offline behavior
- Queue entry: target_id, reason_code, detail_text (encrypted), idempotency_key. Retention RET-EPH until ack.
- On ack `FLG.*` non-retryable: "not sent" message with `message_key`; not retried (CTR-ERR-001).
- Withdraw while queued offline is applied locally as "pending withdraw" and sent with expected_revision.
- Logout or account switch purges queue (CTR-PRV-001 S3-10).

## Recovery
Crash between dedupe insert and event append: the dedupe row is written in the same transaction as `rpt_`; replay finds the row and returns the original. No orphan dedupe rows (sweep daily).

## Concurrency
Triage and link use `expected_revision`. Two moderators triaging the same report: one succeeds; the other receives `EVT.REVISION_CONFLICT` and reloads the queue.

## Authorization
Retries re-run authorization at commit (CTR-CAP-001 R11).

## Privacy, retention, abuse
Client retry logs include key hash only. Queue contents never logged. Mass-submit bursts are limited by quota (PS-094-02) and handled by mod_rate.

## Observability & budgets
`flags_dedupe_hits_total`, `flags_threshold_lag_seconds` p95 ≤ 60 s, `flags_orphan_dedupe_rows` = 0 after daily sweep.

## Tests
- TEST-PS-094-06-01 (retry): five duplicate submits → one `rpt_`, one event, dedupe hit metric +4.
- TEST-PS-094-06-02 (offline): queued report survives restart, sends once after ack, not duplicated on reconnect.
- TEST-PS-094-06-03 (fault): crash after insert, before event → replay returns original, no duplicate.

## Acceptance criteria
1. Duplicate submissions never produce two reports (TEST-01).
2. Offline queue data is absent from logs and purged on logout (TEST-02 plus privacy scan).

## Assumptions & open decisions
- ASSUMPTION: 24 h dedupe window; daily sweep.
- PROVISIONAL (D08 default, unapproved): local pending queue until authenticated relay ack.
