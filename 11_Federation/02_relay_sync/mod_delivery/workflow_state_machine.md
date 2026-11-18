# PS-088-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_delivery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (Failure section), CTR-EVT-001 (R02).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-088-03.R01 | Queue row: queued → scheduled (random 0–60 s delay) → in_flight → acknowledged, or → retry_wait → scheduled, or → dropped_expired, or → dropped_peer_revoked. | MVP |
| PS-088-03.R02 | Retry only on retryable results or transport failure. Backoff exponential with full jitter, base 1 min, cap 6 h (ASSUMPTION). | MVP |
| PS-088-03.R03 | Rows past `expires_at` move to `dropped_expired`. | MVP |
| PS-088-03.R04 | Peer revoked → all its queued rows move to `dropped_peer_revoked`. | MVP |

## Data / schema
States in queue `status` per [domain_schema.md](domain_schema.md).

## Commands / queries / events
`fed.send_batch` → `dlv.sent`; ack processing → `dlv.acknowledged`, `dlv.failed`; drops → `delivery.dropped`.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| queued | schedule | peer trusted | scheduled | random delay 0–60 s |
| scheduled | send | delay elapsed | in_flight | `dlv.sent` |
| in_flight | result accepted/duplicate | — | acknowledged | row closed |
| in_flight | result retryable or transport error | attempt < cap | retry_wait | backoff set |
| in_flight | result rejected (non-retryable) | — | acknowledged | report code |
| retry_wait | timer | not expired | scheduled | none |
| any open | timer | now ≥ expires_at | dropped_expired | `delivery.dropped` |
| any open | peer revoked | — | dropped_peer_revoked | `delivery.dropped` |

## Validation & errors
`DELIVERY.INVALID_TRANSITION` (internal).

## Authorization
`sys_` only (relay and delivery services).

## Failure, idempotency, concurrency, offline
Send is at-least-once; receiver dedupes. Revision gaps hold the aggregate, not the queue (CTR-FED-001).

## Privacy, retention, abuse
Transitions carry IDs only.

## Observability & budgets
Gauges per status; queue depth per peer.

## Tests
- TEST-PS-088-03-01 (state): table rows pass.
- TEST-PS-088-03-02 (backoff): delays follow jitter bounds.
- TEST-PS-088-03-03 (expiry): row dropped at expires_at, not earlier.
- TEST-PS-088-03-04 (revocation): revoke drops all queued rows for that peer.

## Acceptance criteria
1. Table exhaustive.
2. Revocation drops queued events.

## Assumptions & open decisions
- ASSUMPTION: backoff base and cap.
