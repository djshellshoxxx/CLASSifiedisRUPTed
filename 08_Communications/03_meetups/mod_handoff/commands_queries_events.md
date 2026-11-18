# PS-065-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_handoff. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-ERR-001, CTR-SCH-001, CTR-CAP-001 (`attest`, `handoff.*`), CTR-ID-001, CTR-COM-001 (signature shape reused, no payment fields).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-065-04.R01 | Writes carry `idempotency_key` and `expected_revision`. | MVP |
| PS-065-04.R02 | `AttestHandoff` p95 ≤ 300 ms server-side; response returns line ID and new state. | MVP |
| PS-065-04.R03 | Events carry `handoff_id`, state, revision, item count; no quantities per item and no signatures. | MVP |
| PS-065-04.R04 | Queries return both parties' lines only to parties and to F09 dispute service principal under dispute scope. | MVP |
| PS-065-04.R05 | Schema IDs `handoff.opened`, `handoff.attested`, `handoff.confirmed`, `handoff.disputed`, `handoff.closed` at 1.0.0. | MVP |
| PS-065-04.R06 | Bulk attestation for multiple items in one signed batch. | Future |

## Data / schema
| Command | Payload | Error codes |
|---|---|---|
| `OpenHandoff` | `exchange_ref`, `meetup_ref?`, `item_refs[]`, `idempotency_key` | `CLOSED`, `SYS.NOT_FOUND` |
| `AttestHandoff` | `handoff_id`, `item_ref`, `direction`, `quantity`, `signature`, `expected_revision` | `PARTY_NOT_ALLOWED`, `ITEM_NOT_IN_EXCHANGE`, `QUANTITY_EXCEEDED`, `WINDOW_CLOSED`, `ALREADY_ATTESTED`, `SIGNATURE_INVALID`, `KEY_UNKNOWN` |
| `WithdrawAttestation` | `line_id`, `expected_revision` | `NOT_WITHDRAWABLE` |
| `RaiseHandoffDispute` | `handoff_id`, `reason_code` enum | `CLOSED` |

Queries: `GetHandoff(handoff_id)`; `ListHandoffsForExchange(exchange_ref)`.

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Duplicate attestation with same key and digest returns original line. Offline attestation: the signature is created on device, queued (D08 PROVISIONAL) and submitted; if window closed on submission → `not_applied` with `WINDOW_CLOSED`.

## Privacy, retention, abuse
`actor_ref` is `acc_` in audit only. Events exclude quantities.

## Observability & budgets
`handoff_cmd_total{command,result}`; no `handoff_id` labels.

## Tests
- TEST-PS-065-04-01 (contract): payloads validate.
- TEST-PS-065-04-02 (integration): duplicate attest returns same line; one event.
- TEST-PS-065-04-03 (contract): event lint: no quantities or signatures.
- TEST-PS-065-04-04 (negative): non-party query returns `SYS.NOT_FOUND`.

## Acceptance criteria
1. Commands, queries and events implemented as listed.
2. Idempotency verified.
3. Event lint passes.
4. Query scope limited to parties and dispute scope.

## Assumptions & open decisions
- PENDING CTR-ID-001: handoff prefix before final schema IDs.
- PROVISIONAL (D08 default, unapproved): offline queue until relay acknowledgment.
