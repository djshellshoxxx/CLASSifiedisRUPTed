# PS-088-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_delivery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (R10, R11, R13), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-088-02.R01 | Inbound batch > 100 events or > 1 MiB rejected with `FED.SIZE_EXCEEDED` (413) before signature work. | MVP |
| PS-088-02.R02 | Inbound batch from a peer over 600 events/min or 10 MiB/h rejected with `FED.RATE_LIMITED` (429) and `retry_after`. | MVP |
| PS-088-02.R03 | Outbound enqueue to a peer not in `trusted` state rejected with `FED.PEER_NOT_TRUSTED` (403). | MVP |
| PS-088-02.R04 | Event with `expires_at` in the past is not enqueued; result `rejected` with `FED.EXPIRED`. | MVP |

## Data / schema
Rules apply to [domain_schema.md](domain_schema.md).

## Commands / queries / events
Applies to `fed.send_batch`, `fed.receive_batch` (CTR-FED-001 Commands).

## States & transitions
Validation precedes [workflow_state_machine.md](workflow_state_machine.md) transitions.

## Validation & errors
| Code | Retryable | Category / HTTP |
|---|---|---|
| FED.SIZE_EXCEEDED | false | payload_too_large / 413 |
| FED.RATE_LIMITED | true | rate_limited / 429 |
| FED.PEER_NOT_TRUSTED | false | forbidden / 403 |
| FED.EXPIRED | false | gone / 410 |

## Authorization
Peer identity checked before size work only for cheap header checks; full peer state at step 2 of CTR-FED-001 verification.

## Failure, idempotency, concurrency, offline
Deterministic. Size and rate checks run before cryptography (CTR-FED-001 R10).

## Privacy, retention, abuse
Errors include peer label only.

## Observability & budgets
Counter `delivery_validation_failures_total{code}`.

## Tests
- TEST-PS-088-02-01 (unit): R01–R04 codes.
- TEST-PS-088-02-02 (order): oversize batch rejected without signature verification call.
- TEST-PS-088-02-03 (rate): 601st event in a minute rejected with retry-after.

## Acceptance criteria
1. Codes tested.
2. Cheap checks precede crypto.

## Assumptions & open decisions
- ASSUMPTION: limits per CTR-FED-001.
