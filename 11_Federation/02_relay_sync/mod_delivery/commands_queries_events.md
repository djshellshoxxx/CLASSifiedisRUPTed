# PS-088-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_delivery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (Commands section), CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-088-04.R01 | `fed.send_batch` takes `peer`, `event_ids[]`, `idempotency_key` (= batch digest). | MVP |
| PS-088-04.R02 | `fed.receive_batch` returns one result per event in the same order as input. | MVP |
| PS-088-04.R03 | Events: `dlv.sent`, `dlv.acknowledged`, `dlv.failed`, `delivery.dropped` (IDs and codes only). | MVP |

## Data / schema
Batch and result schemas per CTR-FED-001 (batch: `urn:classrupt:contract:CTR-FED-001:batch:1.0.0`).

| Command | Actor | Event | Errors |
|---|---|---|---|
| fed.send_batch | sys_ | dlv.sent | PEER_NOT_TRUSTED, RATE_LIMITED |
| fed.receive_batch | trusted/restricted peer | per-event accepted | SIZE_EXCEEDED, PEER_UNKNOWN, PEER_NOT_TRUSTED |
| ack processing | sys_ | dlv.acknowledged / dlv.failed | ACK_MISMATCH (see file 06) |

## States & transitions
[workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
[validation_rules.md](validation_rules.md).

## Authorization
[authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
`fed.send_batch` idempotent by batch digest; `fed.receive_batch` idempotent per event (CTR-FED-001).

## Privacy, retention, abuse
Events carry IDs and codes only.

## Observability & budgets
Event counts; consumer lag ≤ 60 s (ASSUMPTION).

## Tests
- TEST-PS-088-04-01 (contract): batch and result schemas validate.
- TEST-PS-088-04-02 (idempotency): resend of same batch digest yields same results.
- TEST-PS-088-04-03 (order): result array order matches input.

## Acceptance criteria
1. Command table complete.
2. Result ordering verified.

## Assumptions & open decisions
- PENDING: consumers in DEPENDENCY_MATRIX.md.
