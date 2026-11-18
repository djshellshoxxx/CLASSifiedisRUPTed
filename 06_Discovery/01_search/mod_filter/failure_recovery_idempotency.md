# PS-044-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_filter. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001.

**Decision labels:** D08 PROVISIONAL.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-044-06.R01 | Index unavailable → evaluation returns `SYS.UNAVAILABLE` (503, retryable); it never returns partial results marked complete. | MVP |
| PS-044-06.R02 | Partial index shard failure returns results with `coverage < 1.0` flag and the failed shard count. | MVP |
| PS-044-06.R03 | Saved-search writes idempotent (CTR-EVT-001 R03). | MVP |
| PS-044-06.R04 | Digest job failure retries with backoff; a missed day is sent on next run, at most once. | MVP |
| PS-044-06.R05 | Offline edits queued as pending; server revalidates filter and quota at commit. | MVP |

## Data / schema
Digest job record: `search_id`, `digest_date`, `status`, `attempts`.

## Commands / queries / events
Retry-safe per PS-044-04.

## States & transitions
No new states.

## Validation & errors
Retryable: `SYS.UNAVAILABLE`, `SYS.RATE_LIMITED`. Non-retryable: all `FILTER.*`.

## Authorization
`sys` digest job read scope only.

## Failure, idempotency, concurrency, offline
- Index down: 503 with `retry_after_ms`; client shows cached last results marked stale.
- Save retried after timeout: same key returns original search.
- Offline save after quota reached on another device: rejected, "not applied".

## Privacy, retention, abuse
Failure logs carry codes and shard IDs only.

## Observability & budgets
`filter_partial_results_total`, `filter_digest_missed_total`, index error rate.

## Tests
- TEST-PS-044-06-01 (failure): index down → 503, no complete-looking results.
- TEST-PS-044-06-02 (partial): one of 4 shards down → `coverage` = 0.75.
- TEST-PS-044-06-03 (idempotency): duplicate save → one record.
- TEST-PS-044-06-04 (offline): queued save over quota → "not applied".

## Acceptance criteria
1. No response marked complete when a shard failed (TEST-PS-044-06-02).
2. No duplicate saved searches from retries.
3. Missed digests are sent at most once.

## Assumptions & open decisions
- ASSUMPTION: 30-second cached-results staleness limit on client.
- PROVISIONAL (D08 default, unapproved).
