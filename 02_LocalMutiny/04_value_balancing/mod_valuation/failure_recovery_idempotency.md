# PS-027-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/04_value_balancing/mod_valuation. **Parent:** [mod_valuation SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-COM-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-027-06.R01 | Concurrent computes for the same (`cyc_`, revision, quote-set hash) persist exactly one snapshot. | MVP |
| PS-027-06.R02 | Quote-service timeout (> 2 s) → retry 3 times (1 s, 2 s, 4 s, jittered); then `SYS.UNAVAILABLE` (retryable true). No partial snapshot is written. | MVP |
| PS-027-06.R03 | A snapshot is never half-written: items, per-party nets and hash commit in one transaction. | MVP |
| PS-027-06.R04 | Reconciliation job re-checks `CURRENT` snapshots every 60 s and flips expired ones to `STALE`. | MVP |
| PS-027-06.R05 | Offline value declarations are queued (D08) and re-validated server-side on acknowledgement. | MVP |

## Data / schema
Snapshot unique key (`cyc_`, revision, quote_set_hash). Retry record: attempts, next_attempt_at (no values).

## Commands / queries / events
Retries reuse the same idempotency key. Reconciliation emits `valuation.snapshot_stale` when it flips a row.

## States & transitions
Recovery never moves a STALE row back to CURRENT. A failed compute leaves no row (PS-027-03 R04).

## Validation & errors
Retryable: `SYS.UNAVAILABLE`, `VALUE.QUOTE_STALE`. Non-retryable: all validation codes.

## Authorization
Reconciliation is `sys` with `cyc.execute`; no content read beyond arithmetic.

## Failure, idempotency, concurrency, offline
- Client timeout: retry with same key, max 5 attempts.
- Revision race: loser receives `SYS.CONFLICT` with current revision; client re-reads and recomputes.
- Quote set changes mid-compute: compute fails with `VALUE.QUOTE_STALE` rather than mixing quote sets.
- Offline: queued declarations show "pending" until ack; rejection surfaces the server code.

## Privacy, retention, abuse
Retry logs contain counts and codes only. Pending queue items are encrypted at rest on device (ASSUMPTION).

## Observability & budgets
Metrics: `valuation_quote_retries_total`, `valuation_partial_write_total` (must stay 0), `valuation_pending_queue_age_seconds` p95 ≤ 1 h.

## Tests
- TEST-PS-027-06-01 (concurrency): 20 parallel computes → one row.
- TEST-PS-027-06-02 (fault): kill during write → no partial snapshot visible.
- TEST-PS-027-06-03 (fault): quote service delays 3 s → retries then `SYS.UNAVAILABLE`.
- TEST-PS-027-06-04 (offline): queued declare rejected after quote expiry on ack.

## Acceptance criteria
1. Partial-write metric is 0 across fault suite.
2. Retry schedule matches R02 in integration tests.
3. No snapshot is returned for a mixed quote set.

## Assumptions & open decisions
- ASSUMPTION: 2 s quote timeout; 3 retries.
- PROVISIONAL: offline writes pending until acknowledgement (D08 default, unapproved). See [DECISIONS.md](../../../DECISIONS.md).
