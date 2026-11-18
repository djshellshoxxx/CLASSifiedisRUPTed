# PS-099-06 — failure recovery idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_rate. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R03), CTR-FED-001 (R11, R13), CTR-EVT-001 (R03 for policy commands).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-099-06.R01 | Each class declares `fail_mode`: `closed` (deny), `open_throttled` (allow with a local per-instance limit at 25 % of policy rate), or `open` (allow, read-only classes only). | MVP |
| PS-099-06.R02 | Authentication classes (`auth.*`, recovery) are `closed`. Message send and listing creation are `open_throttled`. Public reads are `open`. | MVP |
| PS-099-06.R03 | Store failure detection within 2 s; fallback to local limiter immediately after detection. | MVP |
| PS-099-06.R04 | Edge retries of the same request ID do not consume a second token (60 s dedupe window, PS-099-04). | MVP |
| PS-099-06.R05 | Federation batches over the per-peer limit are rejected with `FED.RATE_LIMITED` and retry-after; nothing is dropped silently. | MVP |

## Data / schema
Local fallback limiter state is per-instance, in memory, and not shared. Fallback decisions are counted in `rate_fallback_total{class_id}`.

## Commands / queries / events
Policy load is atomic: the new policy becomes active only after full validation (PS-099-03).

## States & transitions
Store recovery returns classes to shared limiting; local buckets are discarded.

## Validation & errors
`RATE.STORE_UNAVAILABLE` (503, retryable true) only for `closed` classes; `open_throttled` and `open` classes never return it.

## Authorization
Not affected by failure modes.

## Failure, idempotency, concurrency, offline
- Clock skew across nodes: GCRA uses the node's monotonic clock for TAT deltas; cross-node sync is not required for correctness, so skew only changes fairness, bounded by the 25 % fallback.
- Offline clients: honor `retry_after_ms`; the PWA queue (D08) does not retry before that time.
- Timeouts: consume 50 ms; on timeout, class fail mode applies.

## Privacy, retention, abuse
Fallback does not change what is stored (nothing is stored).

## Observability & budgets
Alert: fallback active > 5 min (page); denial rate for any class > 5× its 7-day baseline for 10 min (page, possible attack or misconfiguration).

## Tests
- `TEST-PS-099-06-01` fault injection: store down → `closed` classes deny, `open_throttled` allows at 25 %.
- `TEST-PS-099-06-02` integration: edge retry of same request ID consumes one token.
- `TEST-PS-099-06-03` integration: federation batch over limit → `FED.RATE_LIMITED` with retry-after; batch not partially applied.
- `TEST-PS-099-06-04` clock skew 2 s across nodes: fairness within 10 % of single-node reference.

## Acceptance criteria
1. Fail mode table reviewed and applied to every registered class.
2. No `closed` class is open during store outage in test.
3. No federated batch dropped silently.

## Assumptions & open decisions
- ASSUMPTION: 25 % fallback fraction and 2 s detection are defaults.
- D01 (federated protocol), PROVISIONAL default: per-peer limits with explicit retry-after (unapproved).
- D08 (PWA offline writes), PROVISIONAL default: pending queue honors retry-after (unapproved).
