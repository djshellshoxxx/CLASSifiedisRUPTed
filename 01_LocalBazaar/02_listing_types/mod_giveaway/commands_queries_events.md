# PS-005-04 — Commands, queries and events: Giveaway listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M03 Giveaway listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/giveaway` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-005-04.R01** define_terms, select, decline and confirm_collected are vault-local commands; select and decline produce signed statements (classrup.bazaar.giveaway_selection/v1 and classrup.bazaar.giveaway_decision/v1); a requester's vault produces classrup.bazaar.giveaway_request/v1 and classrup.bazaar.giveaway_withdrawal/v1 through request and withdraw.
- **PS-005-04.R02** Incoming statements are handled by bazaar.giveaway_request.receive, which verifies and stores them with provenance or quarantines them.
- **PS-005-04.R03** bazaar.giveaway.recipient_selected is the only catalog event and carries ids and quantity, never notes.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `bazaar.giveaway_terms.define` | bazaar.giveaway_terms.define | [vault-local] { listingId, expectedRevision?, selectionMode, queueLimit?, closesAt?, pickupNote? } | { termsId, revision } | VALIDATION_FAILED, NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `bazaar.giveaway_request.request` | bazaar.giveaway_request.create | [vault-local + statement classrup.bazaar.giveaway_request/v1, encrypted to giver] { giverId, listingId, quantity?, note? } | { requestId, syncState: prepared } | VALIDATION_FAILED, BAZAAR_GIVEAWAY_CLOSED, BAZAAR_GIVEAWAY_DUPLICATE_REQUEST, BLOCKED_PARTY, RATE_LIMITED |  | yes (Idempotency-Key) |
| `bazaar.giveaway_request.receive` | bazaar.giveaway_request.receive | [vault-local, inbound statement] { envelope, provenance } | { requestId?, accepted: boolean, quarantineReason? } | VALIDATION_FAILED, BAZAAR_GIVEAWAY_CLOSED, BAZAAR_GIVEAWAY_DUPLICATE_REQUEST, BAZAAR_GIVEAWAY_LIMIT |  | yes (Idempotency-Key) |
| `bazaar.giveaway_request.select` | bazaar.giveaway_request.decide | [vault-local + statement classrup.bazaar.giveaway_selection/v1, encrypted to requester] { requestId, expectedRevision } | { requestId, revision, holdId, selectedUntil, selectionCid } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, BAZAAR_GIVEAWAY_NOT_SELECTABLE | bazaar.giveaway.recipient_selected | yes (Idempotency-Key) |
| `bazaar.giveaway_request.decline` | bazaar.giveaway_request.decide | [vault-local + statement classrup.bazaar.giveaway_decision/v1] { requestId, expectedRevision } | { requestId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `bazaar.giveaway_request.withdraw` | bazaar.giveaway_request.create | [vault-local + statement classrup.bazaar.giveaway_withdrawal/v1] { requestId } | { requestId, syncState: prepared } | NOT_FOUND, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `bazaar.giveaway_request.confirm_collected` | bazaar.giveaway_request.decide | [vault-local] { requestId, expectedRevision } | { requestId, revision, status: collected } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `bazaar.giveaway_request.list_for_listing` | bazaar.giveaway_request.read_as_giver | { listingId, status?, cursor?, limit <= 50 } | { items: GiveawayRequest[], nextCursor? } | NOT_FOUND |
| `bazaar.giveaway_request.list_mine` | bazaar.giveaway_request.read_own | { status?, cursor?, limit <= 50 } | { items: GiveawayRequest[], nextCursor? } | VALIDATION_FAILED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `bazaar.giveaway.recipient_selected` | P2 | { listingId, requestId, giverId, recipientId, quantity, holdId, selectedUntil, selectionMode } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.listing.unpublished` | expire pending requests with reason closed; selected requests stay valid until selectedUntil |
| `bazaar.listing.expired` | expire pending requests; selected requests stay valid until selectedUntil |
| `bazaar.listing.closed` | expire pending requests |
| `identity.block.added` | drop pending requests between the two parties silently and release their holds |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| BAZAAR_GIVEAWAY_CLOSED | 409 | no | giveaway is not accepting requests (closed, full or unpublished) |
| BAZAAR_GIVEAWAY_DUPLICATE_REQUEST | 409 | no | requester already has a live request on this giveaway |
| BAZAAR_GIVEAWAY_LIMIT | 429 | no | anti-hoarding limit for this requester with this giver reached |
| BAZAAR_GIVEAWAY_NOT_SELECTABLE | 409 | no | request is not pending or no stock is available |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
requester vault: dispatch("bazaar.giveaway_request.request", { "giverId": "did:key:z6MkGiver...", "listingId": "0192f3a4-8888-7d8e-9f01-23456789abcd", "note": "For my class" })
=> { "requestId": "0192f3ae-...", "syncState": "prepared" }   (later transport_acknowledged, then peer_accepted after the giver's signed receipt)
giver vault: dispatch("bazaar.giveaway_request.select", { "requestId": "0192f3ae-...", "expectedRevision": 1 })
=> { "requestId": "0192f3ae-...", "revision": 2, "holdId": "0192f3af-...", "selectedUntil": "2026-11-07T10:00:00.000Z", "selectionCid": "sha256-Zm9v..." }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-005-09.T07 | contract | PS-005-04.R01, PS-005-04.R03, PS-005-09.R02 | request, select, decline, withdraw run | statements validate and verify; recipient_selected payload has no notes |
| TEST-PS-005-09.T08 | integration | PS-005-04.R02, PS-005-05.R02 | statement with wrong signer, tampered body, unknown schema | all quarantined with reasons; none queued |

## Dependencies

Module depends on: F01.S01.M01, F01.S03.M01, F07.S02.M02, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
