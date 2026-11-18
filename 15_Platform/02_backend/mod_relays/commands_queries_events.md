# PS-118-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_relays. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-FED-001 (Commands section, R13), CTR-EVT-001 (R03, R10), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-118-04.R01 | Inbound federation endpoint `POST /v1/federation/batches` accepts one batch per request, idempotent by `batch_id`. | MVP |
| PS-118-04.R02 | Response returns per-event result array in input order. | MVP |
| PS-118-04.R03 | Outbound sends use `POST` to the peer's batch endpoint with the same contract (symmetry). | MVP |
| PS-118-04.R04 | Internal commands carry `idempotency_key` = `(target_peer, origin_node, event_id)`. | MVP |

## Data / schema
Request: batch envelope (PS-118-02). Response:
```json
{ "batch_id": "dlv_…", "results": [ { "event_id": "evt_…", "status": "accepted" }, { "event_id": "evt_…", "status": "rejected", "code": "RELAY.SIGNATURE_INVALID" } ] }
```

## Commands / queries / events
| Command | Caller | Idempotency | Errors |
|---|---|---|---|
| relay.enqueue | federation sync | (peer, origin, event) | PS-118-02 codes |
| relay.forward | scheduler | queue item ID + attempt | FED.RATE_LIMITED, RELAY.PEER_UNREACHABLE |
| relay.ack | peer response | queue item + attempt | RELAY.ACK_UNKNOWN_ITEM (404) |
| relay.expire | TTL job | queue item | none |

Events: `relay_queue_item.dropped`, `relay_queue_item.expired` (CTR-EVT-001 naming). Relay does not emit CTR-FED-001 events itself.

## States & transitions
Command effects as in PS-118-03.

## Validation & errors
`RELAY.PEER_UNREACHABLE` (503, unavailable, retryable true, retry_after_ms). `RELAY.QUEUE_FULL` (503, unavailable, retryable true).

## Authorization
`relay.submit` for peers (own origin events only); `relay.read` for `ope_` diagnostics (digests, counts).

## Failure, idempotency, concurrency, offline
Batch retry by the sender with the same `batch_id` returns the stored result array (CTR-EVT-001 R03 scope).

## Privacy, retention, abuse
Responses contain event IDs and codes only. No envelope bytes in responses.

## Observability & budgets
Route label bounded; p95 batch accept ≤ 300 ms for 100 events (ASSUMPTION).

## Tests
- TEST-PS-118-04-01 (contract): response shape and ordering for mixed results.
- TEST-PS-118-04-02 (integration): same `batch_id` twice returns identical array.
- TEST-PS-118-04-03 (contract): `relay.ack` for unknown item returns 404 with no detail.

## Acceptance criteria
1. Every route and command in the tables is implemented against the listed errors.
2. Result order equals input order in 100% of property-test runs.
3. Retry of a batch after timeout does not create a second queue item.

## Assumptions & open decisions
- PENDING CTR-FED-001 endpoint paths: CTR-FED-001 defines batches but not HTTP paths; path above is ASSUMPTION until the contract is updated.
- D01 PROVISIONAL (default: versioned signed envelopes; unapproved).
