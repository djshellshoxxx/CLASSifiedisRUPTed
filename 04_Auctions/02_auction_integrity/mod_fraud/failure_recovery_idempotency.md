# PS-037-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_fraud. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-037-06.R01 | Bid-stream consumption is at-least-once. Signal writes are idempotent on the dedupe key (PS-037-01). | MVP |
| PS-037-06.R02 | Each rule evaluation has a 200 ms timeout. Timeouts retry up to 5 times with backoff 1 s, 4 s, 16 s, 64 s, 256 s, then move to a dead-letter queue (DLQ). | MVP |
| PS-037-06.R03 | A reconciler runs every 5 min and opens a case for any auction whose max score >= 70 but has no open case. | MVP |
| PS-037-06.R04 | Events older than 24 h at receipt are recorded with `late=true` and do not reopen closed cases. | MVP |
| PS-037-06.R05 | Case writes use optimistic locking on `version`; no last-write-wins. | MVP |

## Data / schema
Adds `late` boolean and `attempt` int to the rule-audit stream (not to FraudSignal).

## Commands / queries / events
Retries reuse the original idempotency key. DLQ entries carry `source_event_id` only.

## States & transitions
Recovery does not create new case states. Reconciler opens cases via `fraud.case_opened` (OPEN).

## Validation & errors
`FRAUD.EVAL_TIMEOUT` (retryable), `FRAUD.DLQ_ENTRY` (non-retryable until replayed by operator).

## Authorization
Reconciler and replay run as `sys`. Operator replay from DLQ requires `fraud.read_aggregate` plus ops ticket reference.

## Failure, idempotency, concurrency, offline
Partial failure (signal written, case not opened): repaired by R03 within 5 min. Concurrent claims: one wins via `version`; the other gets 409. Offline: none; the server is the only writer.

## Privacy, retention, abuse
DLQ payloads hold IDs only, not features or device hashes. DLQ retention 7 days (ASSUMPTION).

## Observability & budgets
DLQ depth gauge; alert when DLQ > 0 for 15 min. Reconciler lag p95 <= 5 min.

## Tests
- TEST-PS-037-06-01 (integration): duplicate delivery produces one signal.
- TEST-PS-037-06-02 (fault): forced timeout x5 lands in DLQ with IDs only.
- TEST-PS-037-06-03 (fault): signal written with case-open failure is repaired within 5 min.
- TEST-PS-037-06-04 (concurrency): two concurrent claims yield one success and one 409.

## Acceptance criteria
1. No duplicate signal under 10x redelivery fixture.
2. Every failure path ends in retry, DLQ or repair; none silently drops.
3. Case updates never lose a version increment.

## Assumptions & open decisions
- ASSUMPTION: 24 h late-event window.
- PROVISIONAL (D07 default, unapproved): DLQ retention 7 days.
