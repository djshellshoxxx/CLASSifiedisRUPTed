# PS-063-01 — Domain schema: In-thread structured offers

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M01 In-thread structured offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/offers` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-063-01.R01** A ThreadOfferCard stores the thread, kind, referenced record ID, pinned revision cid, poster DID, an optional poster note, and a derived display state, with tenant and revision per CTR-ID-001.
- **PS-063-01.R02** The card is a P2 view held only in vaults; it carries a reference and an optional poster note of at most 280 characters that never holds money or item fields, amounts, items and terms are rendered in each receiving vault from the verified pinned revision through the owning module's renderer, and the owning module stays the single source of truth.
- **PS-063-01.R03** The pinned revision hash is the CTR-ID-001 ID-3 cid (sha256-<base64url> of the JCS bytes) of the referenced statement revision and is immutable after posting.

## Specification

### ThreadOfferCard

Schema `classrup.comms.offer_card/v1` · storage **device** · privacy **P2** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| threadId | uuidv8 — ref F08.S01.M02 Thread; must be active at posting |
| kind | enum — bazaar_offer \| bazaar_counter \| mutiny_proposal |
| refId | uuidv7 — record ID in the owning module (offer, negotiation or proposal) |
| rootOfferId? | uuidv7 — for bazaar_offer and bazaar_counter: the root offer of the negotiation chain (F01.S04.M02 rootOfferId) |
| refRevision | int — revision of the referenced record at posting |
| refRevisionHash | string — sha256-<base64url> ID-3 cid of the JCS bytes of the referenced statement revision |
| posterDid | did:key — signer of the card statement, must be a party in the referenced record |
| posterNote? | string — ≤ 280 code points plain text, displayed only under the label poster note; never parsed or shown as amount, item or term |
| displayState | enum — waiting \| posted \| superseded \| closed \| frozen \| unverified |
| closedReason? | enum — accepted \| rejected \| withdrawn \| expired \| declined \| cancelled \| listing_unavailable \| blocked \| frozen |
| unverifiedReason? | enum — record_missing \| revision_mismatch \| signature_invalid \| role_mismatch \| record_removed |
| supersededBy? | uuidv7 — newer verified card of the same reference |
| statementCid | string — sha256 cid of the signed card statement |
| postedAtClaim | timestamp — poster clock, a claim |
| receivedAt? | timestamp — local clock for inbound cards |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most one card per (threadId, refId, refRevision); a card supersedes older cards of the same refId only when it reached posted with a newer refRevision, or when the owning module reports a newer revision.
- displayState posted or closed implies refRevisionHash matched the locally held statement and posterDid is a party of that record.
- A card never changes the state of the referenced record; only owning-module events change displayState.
- Rendered money, item and term fields always come from the verified referenced statement, never from the card or the poster note.
- Field classes are annotated per F10.S02.M02 (references and DIDs P2, poster note P2 free text scanned locally).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-063-09.T01 | unit | PS-063-01.R01, PS-063-01.R02, PS-063-01.R03, PS-063-02.R01 | B posts a card for offer O revision 1 with a poster note | card stored posted with refRevisionHash equal to the ID-3 cid of JCS of O revision 1; note at most 280 characters labelled poster note; amount rendered from O |
| TEST-PS-063-09.T14 | abuse | PS-063-01.R02, PS-063-07.R03 | B posts a card for O (500 EUR) whose poster note says 50 EUR | S's vault shows 500 EUR from the verified offer and the 50 EUR text only under poster note |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F01.S04.M01, F01.S04.M02, F02.S01.M01, F02.S01.M04, F07.S02.M02, F16.S02.M02, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-UX-001. Predecessor: [module SPEC](SPEC.md).
