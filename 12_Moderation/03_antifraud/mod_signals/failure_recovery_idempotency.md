# PS-101-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_signals (Trust&Safety Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02 revision, R03 idempotency), CTR-ERR-001 (R03 retryable), CTR-SCH-001.

**Decision labels:** Retry schedule and dead-letter window are PROVISIONAL (D07 default, unapproved). Offline writes: not applicable (server-side producers only); D08 is not used here.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-101-06.R01 | Ingestion is at-least-once. Dedupe key (`source_event_ref`, `signal_type`) makes effective processing exactly-once. | MVP |
| PS-101-06.R02 | Signal write and outbox entry commit in one transaction. No event without a record, no record without an outbox entry. | MVP |
| PS-101-06.R03 | Retries apply only to retryable codes. Validation failures go to the producer, not the retry queue. | MVP |
| PS-101-06.R04 | After 5 failed attempts, the message moves to a dead-letter queue retained 30 days. | MVP |
| PS-101-06.R05 | Suppress uses `expected_revision`; first valid suppress wins, the second gets `EVT.REVISION_CONFLICT`. | MVP |
| PS-101-06.R06 | Aggregates are rebuildable by replay in revision order. Timestamps never order events. | MVP |

## Data / schema
Dedupe table `sgn_dedupe`: `(source_event_ref, signal_type)` primary key, `signal_id`, `created_at`. Retained with idempotency records (7 days, CTR-EVT-001 R03), then re-derived from the signal record.

## Commands / queries / events
Retry policy: backoff 1 s, 4 s, 16 s, 64 s, 256 s (5 attempts). Producer timeout 2 s. Handler budget p95 150 ms.

## States & transitions
Dead-lettered messages do not change record state. They can be replayed by an operator (`sys_` principal, global) after the cause is fixed.

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| EVT.REVISION_CONFLICT | false | conflict / 409 | Stale suppress |
| EVT.REVISION_GAP | true | internal / 500 | Replica sees gap; holds and resyncs |
| SYS.UNAVAILABLE | true | availability / 503 | Store unreachable |

## Authorization
Replay of dead letters uses an audited `sys_` grant (CTR-CAP-001 R08).

## Failure, idempotency, concurrency, offline
- Crash after commit, before producer ack: producer retries; dedupe returns original `signal_id`.
- Scorer lag: aggregates stale by at most one job cycle; scoring tolerates staleness.
- Concurrency: per-subject lock for suppress and expiry; ingest needs no lock beyond dedupe insert.
- Offline: not applicable.

## Privacy, retention, abuse
Dead-letter payloads contain the same forbidden-field guarantees as live records (PS-101-02). Dead letters expire after 30 days (RET-OPS).

## Observability and budgets
Metrics: `sig_dlq_depth`, `sig_retry_total`, `sig_dedupe_hit_total`. Alert when DLQ depth > 100 for 15 minutes (ASSUMPTION).

## Tests
- TEST-PS-101-15 (integration): kill process after DB commit; retry returns same `signal_id`; one event total.
- TEST-PS-101-16 (integration): five forced failures move message to DLQ; no record written.
- TEST-PS-101-17 (property): concurrent suppresses (10 threads) → exactly one success.

## Acceptance criteria
1. Retry policy matches the table in tests; no validation error is retried.
2. Replay from zero rebuilds identical aggregates (checksum equal).
3. Crash test loses no committed signal.

## Assumptions & open decisions
- ASSUMPTION: message broker provides at-least-once delivery with ordering per subject.
- D07 retry and retention defaults (PROVISIONAL, unapproved).
