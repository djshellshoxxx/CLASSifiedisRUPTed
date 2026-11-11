# PS-005-04 — Commands, queries and events: Giveaway listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M03 Giveaway listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/giveaway` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-005-04.R01** define_terms, select, decline and confirm_collected are vault-local commands; select and decline produce signed statements (classrup.bazaar.giveaway_selection/v1 and classrup.bazaar.giveaway_decision/v1); a requester's vault produces classrup.bazaar.giveaway_request/v1 and classrup.bazaar.giveaway_withdrawal/v1 through request and withdraw.
- **PS-005-04.R02** Incoming statements are handled by bazaar.giveaway_request.receive, which verifies and stores them with provenance or quarantines them.
- **PS-005-04.R03** bazaar.giveaway.recipient_selected is the only catalog event and carries ids and quantity, never notes.
- **PS-005-04.R04** In the requester vault, bazaar.giveaway_selection.receive (capability peer) verifies selection and decline statements: the signer is the author did:key of the verified listing projection, the statement binds requestId, requestCid and listingId (and selectedUntil), it is deduplicated by cid, and anything else is quarantined.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `bazaar.giveaway_terms.define` | bazaar.giveaway_terms.define | [vault-local] { listingId, expectedRevision?, selectionMode, queueLimit?, closesAt?, pickupNote? } | { termsId, revision } | VALIDATION_FAILED, NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `bazaar.giveaway_request.request` | bazaar.giveaway_request.create | [vault-local + statement classrup.bazaar.giveaway_request/v1, encrypted to the giver's mailbox hint of the verified projection] { listingId, listingCid, quantity?, note? } | { requestId, requestCid, syncState: prepared } | VALIDATION_FAILED, NOT_FOUND, BAZAAR_GIVEAWAY_CLOSED, BAZAAR_GIVEAWAY_DUPLICATE_REQUEST, BLOCKED_PARTY, RATE_LIMITED |  | yes (Idempotency-Key) |
| `bazaar.giveaway_request.receive` | bazaar.giveaway_request.receive | [vault-local, inbound statement in the giver vault] { envelope: classrup.bazaar.giveaway_request/v1 \| classrup.bazaar.giveaway_withdrawal/v1, provenance: { syncBatchId, receivedAt, relayId? } } | { requestId?, accepted: boolean, quarantineReason?, tieGroup? } | VALIDATION_FAILED, BAZAAR_GIVEAWAY_CLOSED, BAZAAR_GIVEAWAY_DUPLICATE_REQUEST, BAZAAR_GIVEAWAY_LIMIT |  | yes (Idempotency-Key) |
| `bazaar.giveaway_selection.receive` | bazaar.giveaway_selection.receive | [vault-local, inbound statement in the requester vault] { envelope: classrup.bazaar.giveaway_selection/v1 \| classrup.bazaar.giveaway_decision/v1, provenance } | { requestId?, accepted: boolean, status?, quarantineReason?: signature_invalid\|signer_not_listing_author\|binding_mismatch\|unknown_request\|duplicate } | VALIDATION_FAILED, UNSUPPORTED_SCHEMA_VERSION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `bazaar.giveaway_request.select` | bazaar.giveaway_request.decide | [vault-local + statement classrup.bazaar.giveaway_selection/v1, encrypted to requester] { requestId, expectedRevision, confirmProposal? (first_come) } | { requestId, revision, holdId, selectedUntil, selectionCid } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, BAZAAR_GIVEAWAY_NOT_SELECTABLE | bazaar.giveaway.recipient_selected | yes (Idempotency-Key) |
| `bazaar.giveaway_request.decline` | bazaar.giveaway_request.decide | [vault-local + statement classrup.bazaar.giveaway_decision/v1] { requestId, expectedRevision } | { requestId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `bazaar.giveaway_request.withdraw` | bazaar.giveaway_request.create | [vault-local + statement classrup.bazaar.giveaway_withdrawal/v1] { requestId } | { requestId, syncState: prepared } | NOT_FOUND, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `bazaar.giveaway_request.confirm_collected` | bazaar.giveaway_request.decide | [vault-local] { requestId, expectedRevision } | { requestId, revision, status: collected } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `bazaar.giveaway_request.list_for_listing` | bazaar.giveaway_request.read_as_giver | { listingId, status?, cursor?, limit <= 50 } | { items: GiveawayRequest[], proposedNext?, nextCursor? } | NOT_FOUND |
| `bazaar.giveaway_request.list_mine` | bazaar.giveaway_request.read_own | { status?, cursor?, limit <= 50 } | { items: GiveawayRequest[] (only requests whose requesterId is the local principal), nextCursor? } | VALIDATION_FAILED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `bazaar.giveaway.recipient_selected` | P2 | { listingId, requestId, giverId, recipientId, quantity, holdId, selectedUntil, selectionMode } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.listing.unpublished` | giver vault: expire pending requests with reason closed and queue decline statements; selected requests stay valid until selectedUntil |
| `bazaar.listing.expired` | giver vault: expire pending requests and queue decline statements; selected requests stay valid until selectedUntil |
| `bazaar.listing.closed` | giver vault: expire pending requests and queue decline statements |
| `identity.block.added` | both vaults: drop pending requests between the two parties silently and release their holds in the giver vault |
| `federation.tombstone.applied` | requester vault: when the tombstone targets the giveaway's listing projection, expire the pending request locally |
| `privacy.deletion.completed` | replace the deleted party's DID with the payload pseudonym in requests retained under RET-EVIDENCE and purge their notes |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| BAZAAR_GIVEAWAY_CLOSED | 409 | no | giveaway is not accepting requests (closed, full or unpublished) |
| BAZAAR_GIVEAWAY_DUPLICATE_REQUEST | 409 | no | requester already has a live request on this giveaway |
| BAZAAR_GIVEAWAY_LIMIT | 429 | no | anti-hoarding limit for this requester with this giver, or the fresh-key share of the queue, reached |
| BAZAAR_GIVEAWAY_NOT_SELECTABLE | 409 | no | request is not pending, no stock is available, or a first-come pick lacks the giver's confirmation |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statement registry (N2, F11.S01.M01): classrup.bazaar.giveaway_request/v1 and classrup.bazaar.giveaway_withdrawal/v1, signer role requester (the stated requesterId), ingested by the giver vault; classrup.bazaar.giveaway_selection/v1 {requestId, requestCid, listingId, quantity, selectedUntil, pickupNote?} and classrup.bazaar.giveaway_decision/v1 {requestId, requestCid, listingId, reason: declined|closed|full|sold_out}, signer role listing author (the author of the verified listing projection), ingested by the requester vault. Statements from blocked DIDs are dropped silently (N7). Privacy ports (N6): the module registers ExportSectionPort (sections bazaar.giveaway_terms and bazaar.giveaway_requests), DeletionPort (plan: purge notes, pseudonymize the deleted party in retained requests) and RetentionPurgePort (note purge 30 days after terminal state) with F10.S01.M03, F10.S01.M04 and F10.S01.M02.

### Example

```
requester vault: dispatch("bazaar.giveaway_request.request", { "listingId": "0192f3a4-8888-7d8e-9f01-23456789abcd", "listingCid": "sha256-Lst...", "note": "For my class" })
=> { "requestId": "0192f3ae-...", "requestCid": "sha256-Req...", "syncState": "prepared" }   (later transport_acknowledged, then peer_accepted after the giver's signed receipt)
giver vault: dispatch("bazaar.giveaway_request.select", { "requestId": "0192f3ae-...", "expectedRevision": 1, "confirmProposal": true })
=> { "requestId": "0192f3ae-...", "revision": 2, "holdId": "0192f3af-...", "selectedUntil": "2026-11-07T10:00:00.000Z", "selectionCid": "sha256-Zm9v..." }
requester vault: dispatch("bazaar.giveaway_selection.receive", { "envelope": { "type": "classrup.bazaar.giveaway_selection/v1", "author": "did:key:z6MkGiver...", ... } })
=> { "requestId": "0192f3ae-...", "accepted": true, "status": "selected" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-005-09.T07 | contract | PS-005-01.R04, PS-005-04.R01, PS-005-04.R03, PS-005-09.R02 | request, select, decline, withdraw run in both vaults | statements validate and verify; recipient_selected payload has no notes; stored records validate as classrup.bazaar.giveaway_request_record/v1 with localRole giver or requester and never as the statement schema |
| TEST-PS-005-09.T08 | integration | PS-005-04.R02, PS-005-05.R02 | statement with wrong signer, tampered body, unknown schema | all quarantined with reasons; none queued |
| TEST-PS-005-09.T17 | abuse | PS-005-04.R04, PS-005-03.R04 | R1 receives a selection signed by K, then a valid selection of its older withdrawn request replayed against its new request, then a valid selection | first two quarantined (signer_not_listing_author, binding_mismatch) and the request stays pending; the valid one moves it to selected with selectedUntil; expiry by R1's clock afterwards |

## Dependencies

Module depends on: F01.S01.M01, F01.S03.M01, F07.S02.M02, F16.S02.M03, F11.S01.M01, F11.S01.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
