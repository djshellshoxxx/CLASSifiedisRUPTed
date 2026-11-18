# PS-117-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_api. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R03), CTR-ERR-001 (R03), CTR-SCH-001 (R06).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-117-06.R01 | Request timeout 10 s end to end; downstream call timeout 5 s (ASSUMPTION). | MVP |
| PS-117-06.R02 | api retries a downstream call at most once and only when the downstream declares the command idempotent. | MVP |
| PS-117-06.R03 | Idempotency state survives api restart (durable store, PS-117-01). | MVP |
| PS-117-06.R04 | Circuit breaker opens after 50% failures over 20 calls; half-open probe every 10 s (ASSUMPTION). Open state returns 503 with `retry_after_ms`. | MVP |

## Data / schema
Retry metadata uses `retry_after_ms` only for `rate_limited` and `unavailable` (CTR-ERR-001 R03 table). No new fields.

## Commands / queries / events
No new commands. Replays emit no events (CTR-EVT-001 R03).

## States & transitions
Circuit breaker: CLOSED → OPEN (failure rate ≥ 50%) → HALF_OPEN (after 10 s) → CLOSED (3 successes) or OPEN (1 failure).

## Validation & errors
| Situation | Code | Category | Retryable |
|---|---|---|---|
| Downstream timeout | API.DOWNSTREAM_TIMEOUT | unavailable | true |
| Circuit open | SYS.UNAVAILABLE | unavailable | true |
| Store unavailable | SYS.UNAVAILABLE | unavailable | true |
| Internal fault | SYS.INTERNAL | internal | false |

## Authorization
Recovery actions (replay of dead letters, breaker reset) require `ope_` with `api.administer` (ASSUMPTION); logged as `aud_` records.

## Failure, idempotency, concurrency, offline
- Committed but response lost: client retries with the same key and receives the stored response (PS-117-03).
- Store down during insert: request is rejected before any downstream call (no partial effect).
- Clock skew: TTL uses the store clock, not the api host clock.
- Offline (D08 PROVISIONAL default, unapproved): the PWA resends with the original key until acknowledgment or expiry at 24 h; after expiry, the client must re-validate and use a new key.

## Privacy, retention, abuse
Dead-letter entries store `request_id`, command type and code only. They are purged after 7 days (ASSUMPTION).

## Observability & budgets
Metrics: `api_breaker_state{downstream}`, `api_retries_total`. Recovery time objective for api tier: 15 min (ASSUMPTION).

## Tests
- TEST-PS-117-06-01 (integration): inject 6 s downstream delay; client gets API.DOWNSTREAM_TIMEOUT.
- TEST-PS-117-06-02 (chaos): kill store primary during 100 commands; zero duplicate effects.
- TEST-PS-117-06-03 (unit): breaker transitions match the state list.

## Acceptance criteria
1. No command produces two committed effects under a 10× retry storm (load test).
2. Breaker opens within 20 calls of a 50% failure rate.
3. After restart, replay of a pre-restart key returns the original result.

## Assumptions & open decisions
- ASSUMPTION: timeout and breaker thresholds above.
- D08 (PROVISIONAL default, unapproved): offline key window of 24 h.
