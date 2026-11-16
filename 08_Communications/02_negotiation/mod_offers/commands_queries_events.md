# PS-063-04 — Commands, queries and events: In-thread structured offers

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M01 In-thread structured offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/offers` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-063-04.R01** Posting is a vault command that produces a signed statement and delegates delivery to comms.message.send as a typed item; reading is a vault query.
- **PS-063-04.R02** Posting emits comms.offer_card.posted in the same IndexedDB transaction as the local card record, and inbound verification emits the same event with actor kind federated.
- **PS-063-04.R03** The module consumes owning-module events derived from verified statements to update card state.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `comms.offer_card.post` | comms.offer_card.post | [vault command; produces signed statement classrup.comms.offer_card/v1] { threadId, kind, refId, refRevision, snapshot? } | { cardId, revision: 1, displayState: posted } | VALIDATION_FAILED, NOT_FOUND, FORBIDDEN, CONFLICT_STATE, COMMS_CARD_REVISION_MISMATCH, RATE_LIMITED | comms.offer_card.posted | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `comms.offer_card.list_thread` | comms.offer_card.read | [vault query] { threadId, includeClosed?: boolean, limit ≤ 50 } | { items: ThreadOfferCard[] with live displayState } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `comms.offer_card.posted` | P2 | { cardId, threadId, kind, refId, refRevision, posterDid, origin: local\|federated } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.offer.accepted` | close cards referencing the offer with reason accepted |
| `bazaar.offer.rejected` | close cards referencing the offer with reason rejected |
| `bazaar.offer.withdrawn` | close cards referencing the offer with reason withdrawn |
| `bazaar.offer.expired` | close cards referencing the offer with reason expired |
| `bazaar.negotiation.countered` | mark the offer card superseded and offer posting a counter card |
| `bazaar.negotiation.closed` | close counter cards with the negotiation outcome reason |
| `mutiny.proposal.revised` | mark cards for earlier revisions of the proposal superseded |
| `mutiny.proposal.accepted` | close proposal cards with reason accepted |
| `mutiny.proposal.rejected` | close proposal cards with reason rejected |
| `mutiny.proposal.expired` | close proposal cards with reason expired |
| `comms.thread.archived` | freeze cards of the thread read-only |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMS_CARD_REVISION_MISMATCH | 409 | no | pinned revision hash differs from the revision held locally |
| COMMS_CARD_SIGNATURE_INVALID | 422 | no | inbound card statement signature or signer role is invalid; card stored unverified |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command comms.offer_card.post
{ "threadId": "0192f3a4-0000-7000-8000-0000000000aa", "kind": "bazaar_offer", "refId": "0192f3a5-1111-7000-8000-000000000001", "refRevision": 1 }
-> { "cardId": "0192f3a6-2222-7000-8000-000000000001", "revision": 1, "displayState": "posted" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-063-09.T05 | contract | PS-063-04.R01, PS-063-04.R02, PS-063-09.R02 | post and list executes | output, statement and event payload validate against registry schemas |
| TEST-PS-063-09.T06 | integration | PS-063-04.R03 | deliver offer accepted, negotiation countered, proposal revised and thread archived events | cards become closed, superseded, superseded and frozen respectively |
| TEST-PS-063-09.T13 | a11y | PS-063-04.R01 | thread with all card states on mobile with screen reader | regions named, status announced, zero serious axe issues |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F01.S04.M01, F02.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
