# PS-088-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_delivery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (Failure section, R13), CTR-EVT-001 (R02), CTR-ERR-001 (R03).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-088-06.R01 | Retry only when the error code's `retryable` is true (CTR-ERR-001 R03); never infer retry from status. | MVP |
| PS-088-06.R02 | `FED.KEY_UNKNOWN` events are deferred up to 24 h before rejection. | MVP |
| PS-088-06.R03 | Transport timeout per batch 30 s (ASSUMPTION); timeout counts as retryable. | MVP |
| PS-088-06.R04 | `ACK_MISMATCH` (result count ≠ batch count) is non-retryable for that batch and alerts. | MVP |
| PS-088-06.R05 | Queue storage unavailable: enqueue fails closed; no event is marked sent. | MVP |

## Data / schema
Uses queue fields in [domain_schema.md](domain_schema.md).

## Commands / queries / events
Per [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
| Code | Retryable | When |
|---|---|---|
| FED.RATE_LIMITED | true | peer limit |
| FED.KEY_UNKNOWN | true | deferred 24 h |
| SYS.UNAVAILABLE | true | queue store down |
| DELIVERY.ACK_MISMATCH | false | result count mismatch |

## Authorization
Retries re-authorize peer state.

## Failure, idempotency, concurrency, offline
Backoff per PS-088-03.R02. Revision gap holds that aggregate only. Offline nodes never send.

## Privacy, retention, abuse
Logs carry codes and counts.

## Observability & budgets
Retry histogram; time-to-deliver p95 ≤ 5 min when peer online (ASSUMPTION).

## Tests
- TEST-PS-088-06-01 (retry): non-retryable code not retried.
- TEST-PS-088-06-02 (deferred key): key arrives at 2 h, event accepted.
- TEST-PS-088-06-03 (fault): queue store down blocks enqueue, no false sent.
- TEST-PS-088-06-04 (timeout): batch timeout retried with jitter.

## Acceptance criteria
1. Retry rules match codes.
2. No false "sent" under fault.

## Assumptions & open decisions
- ASSUMPTION: 30 s timeout; delivery budget.
