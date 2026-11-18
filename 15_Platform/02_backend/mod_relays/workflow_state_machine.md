# PS-118-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_relays. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-FED-001 (R05, R12, R13), CTR-EVT-001 (R03).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-118-03.R01 | Queue item states are exactly QUEUED, IN_FLIGHT, ACKED, REJECTED, EXPIRED. | MVP |
| PS-118-03.R02 | Delivery is at-least-once; receiver dedupes by (origin_node, event_id). | MVP |
| PS-118-03.R03 | Retry backoff: 30 s base, doubling, cap 1 h, ±20% jitter (ASSUMPTION). | MVP |
| PS-118-03.R04 | Outbound batch sent after random delay 0–60 s (CTR-FED-001 R12). | MVP |

## Data / schema
`relay_queue_item.state`, `attempts`, `next_attempt_at` (PS-118-01).

## Commands / queries / events
`relay.forward` (scheduler), `relay.ack` (peer response), `relay.expire` (TTL job).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| QUEUED | scheduler picks item | now ≥ next_attempt_at, peer trusted | IN_FLIGHT | attempts += 1; random delay applied |
| QUEUED | peer restricted | — | QUEUED | next_attempt_at deferred |
| IN_FLIGHT | peer ack `accepted` or `duplicate` | — | ACKED | none |
| IN_FLIGHT | peer ack `rejected` | code not retryable | REJECTED | emit `relay_queue_item.dropped` |
| IN_FLIGHT | peer ack `deferred` or transport error | expires_at > now | QUEUED | backoff |
| IN_FLIGHT | no response | 2 min elapsed (ASSUMPTION) | QUEUED | backoff |
| QUEUED or IN_FLIGHT | TTL job | now ≥ expires_at | EXPIRED | emit `relay_queue_item.expired` |
| QUEUED | peer revoked | CTR-FED-001 state `revoked` | EXPIRED | purge bytes now |

## Validation & errors
Invalid transitions are internal errors (`SYS.INTERNAL`) and are counted. Transition codes come from PS-118-02.

## Authorization
Only the relay `sys_` principal performs transitions. Peer decisions arrive as signed acks.

## Failure, idempotency, concurrency, offline
Crash during IN_FLIGHT: on restart, items in IN_FLIGHT older than 2 min move to QUEUED (may re-send; receiver dedupes). Concurrent scheduler workers claim items with `SELECT … FOR UPDATE SKIP LOCKED`.

## Privacy, retention, abuse
On EXPIRED or REJECTED, `envelope_bytes` is zeroed; only digest, code and timestamps remain for 30 days.

## Observability & budgets
Gauge per state; p95 enqueue-to-first-attempt ≤ 60 s + random delay (ASSUMPTION). Alert when QUEUED items older than 1 h exceed 1% of depth.

## Tests
- TEST-PS-118-03-01 (unit): transition table, including forbidden transitions.
- TEST-PS-118-03-02 (integration): peer offline 24 h; items retry with capped backoff, then expire.
- TEST-PS-118-03-03 (chaos): kill worker during IN_FLIGHT; no item lost, duplicates deduped.

## Acceptance criteria
1. Zero items remain IN_FLIGHT > 2 min after worker restart.
2. Peer revocation purges bytes within 1 min.
3. Duplicate delivery produces one processed event at the receiver.

## Assumptions & open decisions
- ASSUMPTION: backoff values and 2-minute in-flight timeout.
- D01 PROVISIONAL (default: explicit opt-in federation; unapproved): sends only to peers in an enabled state.
