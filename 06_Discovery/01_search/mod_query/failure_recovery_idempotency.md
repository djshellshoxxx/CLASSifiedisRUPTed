# PS-046-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_query. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R03), CTR-PRV-001 (R05); PENDING CTR-DSC-001.

**Decision labels:** Degraded results mode is PROVISIONAL (D08 read-side default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-046-06.R01 | Index unavailable → `SYS.UNAVAILABLE` (retryable true); no stale result served as current without `stale: true` flag. | MVP |
| PS-046-06.R02 | Retries of identical requests are safe and return equivalent results within the same snapshot TTL. | MVP |
| PS-046-06.R03 | Rate-limit state uses fixed windows in RET-EPH stores; loss of the store fails open for guest budget only for 60 s (ASSUMPTION) and closed for `acc_` budgets. | MVP |
| PS-046-06.R04 | Circuit breaker opens after 50% errors over 30 s; half-open probes 1 request per 5 s. | MVP |

## Data / schema
Rate counters: key (`principal_or_guest_hash`, `window_start`), TTL 24 h (RET-EPH).

## Commands / queries / events
Read path only. Retry budget for clients: 3 attempts, exponential backoff with jitter, 0.5 s base.

## States & transitions
Breaker: `closed → open → half_open → closed`. See PS-046-03 for request states.

## Validation & errors
`SYS.UNAVAILABLE` retryable true; `QUERY.TIMEOUT` retryable true; `SYS.RATE_LIMITED` retryable true after retry-after.

## Authorization
Breaker state does not change authorization decisions.

## Failure, idempotency, concurrency, offline
Offline clients show last cached result set labelled "last updated" and never claim freshness. Cached results cleared on logout and account switch (CTR-PRV-001 R11 context).

## Privacy, retention, abuse
Cached results on device follow LOCATION_COARSE and PUBLIC classes only; no query text cached beyond the session.

## Observability & budgets
Metrics: `query_breaker_state`, `query_stale_served_total`, `query_rate_limit_fail_open_total`.

## Tests
- TEST-PS-046-06-01 (chaos): kill index replica; requests get SYS.UNAVAILABLE within 2 s.
- TEST-PS-046-06-02 (unit): breaker transitions per table.
- TEST-PS-046-06-03 (offline): cached results show "last updated" and clear on logout.

## Acceptance criteria
1. Breaker opens within 30 s of 50% error rate in load test.
2. No response marked current when served from stale cache.
3. Fail-open guest budget capped at 60 s window (test verified).

## Assumptions & open decisions
- ASSUMPTION: fail-open limited to guest budget.
- D08 PROVISIONAL: offline search is read-only cache.
