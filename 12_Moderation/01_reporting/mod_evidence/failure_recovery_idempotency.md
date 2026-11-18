# PS-093-06 — failure, recovery, idempotency and offline

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/01_reporting/mod_evidence (Trust&Safety Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-093-06.R01 | Capture retries reuse the same idempotency key; at most 3 scanner retries with backoff 1 s, 4 s, 16 s. | MVP |
| PS-093-06.R02 | Scanner outage never exposes content. Item stays `capturing` up to 15 min, then `rejected` with `EVD.CAPTURE_EXPIRED`. | MVP |
| PS-093-06.R03 | Offline reporters queue captures locally, encrypted, until server ack (D08). Queue is cleared on logout and account switch. | MVP |
| PS-093-06.R04 | Redact and hold commands use `expected_revision`; conflicts return `EVT.REVISION_CONFLICT` with no silent merge. | MVP |
| PS-093-06.R05 | Backup restore replays purges and holds before serving evidence (CTR-PRV-001 R06). | MVP |

## Retry and timeouts
| Path | Timeout | Retry | Terminal behavior |
|---|---|---|---|
| Upload to staging | 30 s per request | client, same key, max 5 | staging TTL 15 min |
| Scanner call | 5 s | server, 3 attempts | `capturing` then `rejected` |
| Hash / store write | 2 s | server, 2 attempts | `capturing`; alert |
| Content download | 10 s | client, 2 attempts | none |

## Offline behavior
- Client strips metadata before queueing (PS-093-02 R03) so no GPS sits in the queue.
- Queue entries have `RET-EPH`; purged on server ack (CTR-PRV-001).
- Non-retryable server code moves entry to "not applied" with `message_key` (CTR-ERR-001).
- Offline clients never mark evidence as captured locally.

## Recovery
Partial failure leaves staging objects that are purged by TTL job. The job is idempotent and runs every 5 min. A crashed redaction is detected by `revision` mismatch on retry.

## Concurrency
Per-`evidence_id` writes are serialized under the aggregate lock (CTR-EVT-001 R02). Reads are lock-free and return the last committed revision.

## Authorization
Retries never escalate authority; each retry is re-authorized (CTR-CAP-001 R11).

## Privacy, retention, abuse
Retry logs carry key hash and code only. Queue contents are never logged. Repeated capture attempts with rejected content from one reporter feed the abuse signal in mod_abuse (PS-095).

## Observability & budgets
`evidence_retry_total{path}`, `evidence_staging_orphans` (must be 0 after TTL + 5 min). Alert when scanner unavailable > 5 min.

## Tests
- TEST-PS-093-06-01 (fault injection): scanner down for 20 min → no content visible, item `rejected` after 15 min.
- TEST-PS-093-06-02 (offline): queued capture survives app restart; purged after ack.
- TEST-PS-093-06-03 (restore): backup restored with pending purge → purge replayed before any read.

## Acceptance criteria
1. Duplicate submission under same key creates one `mev_` (TEST-PS-093-04-02 extended).
2. No orphaned staging objects after TTL + 5 min.

## Assumptions & open decisions
- ASSUMPTION: 15 min staging TTL; 3 scanner retries.
- PROVISIONAL (D08 default, unapproved): local pending queue until authenticated relay ack.
