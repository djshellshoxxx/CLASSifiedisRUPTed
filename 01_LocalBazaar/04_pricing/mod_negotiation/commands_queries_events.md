# PS-010-04 — Commands, queries and events: Price negotiation

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M02 Price negotiation](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/negotiation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-010-04.R01** counter, accept, reject, withdraw and discard are vault commands; counter, accept, reject and withdraw produce signed statements (classrup.bazaar.negotiation_round/v1, classrup.bazaar.negotiation_accept/v1, classrup.bazaar.negotiation_close/v1); receive handles inbound statements; confirm is produced by the seller vault as classrup.bazaar.negotiation_confirm/v1.
- **PS-010-04.R02** Sync state of every outbound statement is prepared, transport_acknowledged (relay receipt) or peer_accepted (peer's signed acknowledgement); the UI shows no more than the reached state.
- **PS-010-04.R03** Events are emitted in each vault from local state changes after verification; the two vaults emit equivalent events independently.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `bazaar.negotiation.counter` | bazaar.negotiation.counter | [vault-local + statement classrup.bazaar.negotiation_round/v1, encrypted to counterparty] { offerId \| negotiationId, expectedRevision?, amount, quantity?, note?, expiresInMs? (default 172800000) } | { negotiationId, roundNo, revision, statementCid, syncState: prepared } | VALIDATION_FAILED, NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, BLOCKED_PARTY, BAZAAR_NEGOTIATION_ROUND_LIMIT, BAZAAR_NEGOTIATION_NOT_CONVERGING, BAZAAR_NEGOTIATION_LISTING_CHANGED, RATE_LIMITED | bazaar.negotiation.countered | yes (Idempotency-Key) |
| `bazaar.negotiation.accept` | bazaar.negotiation.decide | [vault-local + statement classrup.bazaar.negotiation_accept/v1; in the seller vault also classrup.bazaar.negotiation_confirm/v1] { negotiationId, expectedRevision, roundNo, roundCid, listingRevision } | { negotiationId, revision, status: accept_sent\|accepted, dealId?, holdId? } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED, BLOCKED_PARTY, BAZAAR_NEGOTIATION_LISTING_CHANGED, BAZAAR_NEGOTIATION_HOLD_FAILED, DEPENDENCY_UNAVAILABLE | bazaar.negotiation.closed | yes (Idempotency-Key) |
| `bazaar.negotiation.reject` | bazaar.negotiation.decide | [vault-local + statement classrup.bazaar.negotiation_close/v1] { negotiationId, expectedRevision } | { negotiationId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | bazaar.negotiation.closed | yes (Idempotency-Key) |
| `bazaar.negotiation.withdraw` | bazaar.negotiation.withdraw | [vault-local + statement classrup.bazaar.negotiation_close/v1] { negotiationId, expectedRevision } | { negotiationId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | bazaar.negotiation.closed | yes (Idempotency-Key) |
| `bazaar.negotiation.discard_frozen` | bazaar.negotiation.decide | [vault-local + statement classrup.bazaar.negotiation_close/v1] { negotiationId, expectedRevision } | { negotiationId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | bazaar.negotiation.closed | yes (Idempotency-Key) |
| `bazaar.negotiation.receive` | bazaar.negotiation.receive | [vault-local, inbound statement] { envelope, provenance } | { negotiationId?, accepted: boolean, quarantineReason?, replyStatementCid? } | VALIDATION_FAILED, UNSUPPORTED_SCHEMA_VERSION, CONFLICT_STATE | bazaar.negotiation.countered, bazaar.negotiation.closed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `bazaar.negotiation.get` | bazaar.negotiation.read | { negotiationId } | { negotiation: Negotiation, rounds: NegotiationRound[] } | NOT_FOUND |
| `bazaar.negotiation.list_mine` | bazaar.negotiation.read | { status?, listingId?, cursor?, limit <= 50 } | { items: Negotiation[], nextCursor? } | VALIDATION_FAILED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `bazaar.negotiation.countered` | P2 | { negotiationId, listingId, variantId?, roundNo, proposerId, recipientId, amount, listingRevision, expiresAt } |
| `bazaar.negotiation.closed` | P2 | { negotiationId, listingId, variantId?, buyerId, sellerId, outcome: accepted\|rejected\|withdrawn\|expired\|superseded\|listing_unavailable\|blocked\|frozen_discarded, finalAmount?, dealId?, holdId? } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.listing.edited` | when material, mark open chains listingChangedSinceRound; accept is then refused until the proposer sends a new round on the new revision |
| `bazaar.listing.unpublished` | close open chains with outcome listing_unavailable |
| `bazaar.listing.expired` | close open chains with outcome listing_unavailable |
| `bazaar.inventory.depleted` | close open chains on that variant with outcome superseded unless this chain holds the stock |
| `identity.block.added` | close chains between the two parties with outcome blocked and send no revealing notification |
| `bazaar.offer.rejected` | link the root offer; a rejection with reason countered confirms the chain start |
| `bazaar.offer.expired` | close a chain that never progressed beyond the root offer |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| BAZAAR_NEGOTIATION_ROUND_LIMIT | 409 | no | the chain already has 10 rounds |
| BAZAAR_NEGOTIATION_NOT_CONVERGING | 422 | no | the counter moves away from the other side's last amount |
| BAZAAR_NEGOTIATION_LISTING_CHANGED | 409 | no | the listing changed materially since the round; review and send a new round |
| BAZAAR_NEGOTIATION_HOLD_FAILED | 409 | no | seller could not reserve the item; chain closed as superseded |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
seller vault: dispatch("bazaar.negotiation.counter", { "offerId": "0192f3a5-...", "amount": { "amount": "4800", "currency": "EUR" }, "note": "Includes helmet" })
=> { "negotiationId": "0192f3b0-...", "roundNo": 1, "revision": 1, "statementCid": "sha256-Zm9v...", "syncState": "prepared" }
buyer vault: dispatch("bazaar.negotiation.accept", { "negotiationId": "0192f3b0-...", "expectedRevision": 2, "roundNo": 1, "roundCid": "sha256-Zm9v...", "listingRevision": 5 })
=> { "negotiationId": "0192f3b0-...", "revision": 3, "status": "accept_sent" }
seller vault receives acceptance, holds inventory, opens Deal, signs confirmation => buyer vault shows accepted with dealId.
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-010-09.T08 | contract | PS-010-04.R01, PS-010-04.R03, PS-010-09.R02 | each command and inbound statement | statements validate and verify; countered and closed payloads contain no notes |
| TEST-PS-010-09.T09 | integration | PS-010-04.R02, PS-010-06.R03 | statements sent with relay down then up | states move prepared to transport_acknowledged to peer_accepted only on receipts; UI never shows more |
| TEST-PS-010-09.T11 | integration | PS-010-04.R03 | listing edited materially, unpublished, depleted, blocked | chain flagged or closed with documented outcomes |

## Dependencies

Module depends on: F01.S04.M01, F01.S03.M01, F01.S01.M01, F01.S02.M01, F09.S01.M01, F09.S03.M03, F07.S02.M02, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
