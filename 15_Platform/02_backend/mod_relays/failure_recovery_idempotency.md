# PS-118-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_relays. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-FED-001 (R05, R06, R10, R11, Failure section), CTR-EVT-001 (R03), CTR-ERR-001 (R03).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-118-06.R01 | Outbound HTTP timeout 10 s per batch; connect timeout 3 s (ASSUMPTION). | MVP |
| PS-118-06.R02 | Peer unreachable: queue retains items for up to 7 days; no drop before TTL unless peer revoked. | MVP |
| PS-118-06.R03 | Relay restart loses zero acknowledged enqueues (durable write before 202). | MVP |
| PS-118-06.R04 | Equivocation detection quarantines the peer within one batch (CTR-FED-001 R06). | MVP |

## Data / schema
Quarantine flag is a CTR-FED-001 peer state change requested by relay with `ope_` review; relay does not set it alone.

## Commands / queries / events
Quarantine request emits a CTR-FED-001 peer event (owned by F11) — relay only requests.

## States & transitions
Peer send path: CLOSED (normal) → BREAKER_OPEN after 5 consecutive transport failures to one peer → HALF_OPEN after 60 s → CLOSED after one success.

## Validation & errors
| Situation | Code | Category | Retryable |
|---|---|---|---|
| Peer unreachable | RELAY.PEER_UNREACHABLE | unavailable | true |
| Breaker open | RELAY.PEER_UNREACHABLE | unavailable | true (retry_after_ms = 60000) |
| Equivocation | FED.EQUIVOCATION | conflict | false |
| Queue full | RELAY.QUEUE_FULL | unavailable | true |

## Authorization
Breaker reset is `ope_` action; logged `aud_`.

## Failure, idempotency, concurrency, offline
- Partial batch failure: per-event results are persisted before the response is sent.
- Duplicate sends after timeout are safe (receiver dedupes).
- Queue full: new enqueues rejected with 503; existing items unaffected; no silent drop.
- Peer offline for days: items expire at 7 days; the origin node keeps its own copy (CTR-FED-001 outbound store, owned by F11).

## Privacy, retention, abuse
Breaker state holds peer ID and counters only. Quarantine reasons are codes.

## Observability & budgets
Metrics: `relay_breaker_state{peer_class}`, `relay_queue_full_total`. Recovery time after relay restart ≤ 60 s (ASSUMPTION).

## Tests
- TEST-PS-118-06-01 (chaos): kill relay after 202, before forward; item recovered and sent.
- TEST-PS-118-06-02 (integration): breaker opens after 5 failures and half-opens after 60 s.
- TEST-PS-118-06-03 (security): two conflicting events trigger quarantine.

## Acceptance criteria
1. Zero acknowledged enqueues lost in 100 crash-restart cycles.
2. Queue-full returns 503 with retry hint, never 200 with silent drop.
3. Equivocation quarantine occurs in the batch in which it is detected.

## Assumptions & open decisions
- ASSUMPTION: timeouts and breaker thresholds above.
- D08 PROVISIONAL (default: local pending queue until authenticated relay acknowledgment; unapproved): the client side of the same acknowledgment rule.
