# PS-063-04 — Commands, queries and events: In-thread structured offers

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M01 In-thread structured offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/offers` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-063-04.R01** Posting is a vault command that produces a signed statement and delegates delivery to comms.message.send as a typed item; reading is a vault query.
- **PS-063-04.R02** Posting emits comms.offer_card.posted in the same IndexedDB transaction as the local card record, and inbound verification emits the same event with actor kind federated.
- **PS-063-04.R03** The module consumes owning-module events derived from verified statements to update card state, and looks up the root offer of a counter through bazaar.negotiation.get (F01.S04.M02) because the countered event does not carry it.
- **PS-063-04.R04** Statements are registered with F11.S01.M01 (N2): classrup.comms.offer_card/v1 { threadId, kind, refId, refRevision, refRevisionHash, posterNote? } signed by a device key of a party of the referenced record.
- **PS-063-04.R05** The module registers ExportSectionPort (section comms.offer_cards), DeletionPort (plan, execute, pseudonymize) and RetentionPurgePort with F10 (N6); cards are purged with their thread and carry no evidence of their own.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `comms.offer_card.post` | comms.offer_card.post | [vault command; produces signed statement classrup.comms.offer_card/v1] { threadId, kind, refId, refRevision, posterNote? } | { cardId, revision: 1, displayState: posted, refRevisionHash } | VALIDATION_FAILED, NOT_FOUND, FORBIDDEN, CONFLICT_STATE, COMMS_CARD_REVISION_MISMATCH, RATE_LIMITED | comms.offer_card.posted | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `comms.offer_card.list_thread` | comms.offer_card.read | [vault query] { threadId, includeClosed?: boolean, limit ≤ 50 } | { items: ThreadOfferCard[] with live displayState and the amount, items and terms rendered from the verified referenced revision } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `comms.offer_card.posted` | P2 | { cardId, threadId, kind, refId, refRevision, refRevisionHash, posterDid, origin: local\|federated } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.offer.accepted` | close cards referencing the offer with reason accepted |
| `bazaar.offer.rejected` | close cards referencing the offer with reason rejected |
| `bazaar.offer.withdrawn` | close cards referencing the offer with reason withdrawn |
| `bazaar.offer.expired` | close cards referencing the offer with reason expired |
| `bazaar.negotiation.countered` | look up rootOfferId through bazaar.negotiation.get (F01.S04.M02), mark posted cards of that root offer or earlier rounds superseded, and offer posting a counter card |
| `bazaar.negotiation.closed` | map the outcome onto counter and root offer cards - accepted, rejected, withdrawn, expired, listing_unavailable and blocked close with the same reason, timeout closes with expired, frozen_discarded closes with frozen, superseded moves the card to superseded |
| `mutiny.proposal.revised` | mark posted cards for earlier revisions of the proposal superseded |
| `mutiny.proposal.accepted` | close proposal cards with reason accepted |
| `mutiny.proposal.rejected` | close proposal cards with reason rejected |
| `mutiny.proposal.expired` | close proposal cards with reason expired |
| `mutiny.proposal.withdrawn` | close proposal cards with reason withdrawn |
| `mutiny.revision.forked` | freeze posted cards of the forked proposal without actions until a revision event or terminal event resolves it |
| `comms.thread.archived` | freeze cards of the thread read-only |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMS_CARD_REVISION_MISMATCH | 409 | no | pinned revision cid differs from the revision held locally |
| COMMS_CARD_SIGNATURE_INVALID | 422 | no | inbound card statement signature, key status or signer role is invalid; card stored unverified |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command comms.offer_card.post
{ "threadId": "5f3a9c1e-7b2d-8e4f-9a01-23456789abcd", "kind": "bazaar_offer", "refId": "0192f3a5-1111-7000-8000-000000000001", "refRevision": 1, "posterNote": "Can pick up Saturday" }
-> { "cardId": "0192f3a6-2222-7000-8000-000000000001", "revision": 1, "displayState": "posted", "refRevisionHash": "sha256-q0hH…" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-063-09.T05 | contract | PS-063-04.R01, PS-063-04.R02, PS-063-09.R02 | post and list execute | output, statement and event payload validate against registry schemas |
| TEST-PS-063-09.T06 | integration | PS-063-04.R03 | deliver offer accepted, negotiation countered, negotiation closed with timeout, proposal revised and thread archived events | cards become closed, superseded, closed with expired, superseded and frozen read-only respectively |
| TEST-PS-063-09.T16 | integration | PS-063-03.R04, PS-063-04.R03 | mutiny.proposal.withdrawn and mutiny.revision.forked for P | P cards close with reason withdrawn, or freeze without actions and later close or are superseded when the owning module resolves |
| TEST-PS-063-09.T17 | unit | PS-063-04.R04, PS-063-04.R03 | bazaar.negotiation.countered for N without rootOfferId; registry lookup for classrup.comms.offer_card/v1 | rootOfferId resolved through bazaar.negotiation.get and the O card superseded; registry entry lists signer role party of the referenced record |
| TEST-PS-063-09.T18 | integration | PS-063-04.R05, PS-063-07.R04 | account deletion with cards in two threads | DeletionPort plan lists the cards, execute purges them with their threads; export section comms.offer_cards present beforehand |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F01.S04.M01, F01.S04.M02, F02.S01.M01, F02.S01.M04, F07.S02.M02, F16.S02.M02, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
