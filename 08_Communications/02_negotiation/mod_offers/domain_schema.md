# PS-063-01 — Domain schema: In-thread structured offers

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M01 In-thread structured offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/offers` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-063-01.R01** A ThreadOfferCard stores the thread, kind, referenced record ID, pinned revision hash, poster DID, a display snapshot, and a derived display state, with tenant and revision per CTR-ID-001.
- **PS-063-01.R02** The card is a P2 view held only in vaults; it carries a reference and a snapshot of at most 280 characters, never the canonical amounts or terms, and the owning module stays the single source of truth.
- **PS-063-01.R03** The pinned revision hash is the SHA-256 of the JCS bytes of the referenced statement revision and is immutable after posting.

## Specification

### ThreadOfferCard

Schema `classrup.comms.offer_card/v1` · storage **device** · privacy **P2** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| threadId | uuidv7 — ref F08.S01.M02 Thread; must be active at posting |
| kind | enum — bazaar_offer \| bazaar_counter \| mutiny_proposal |
| refId | uuidv7 — record ID in the owning module (offer, negotiation or proposal) |
| refRevision | int — revision of the referenced record at posting |
| refRevisionHash | string — SHA-256 hex of JCS bytes of the referenced statement revision |
| posterDid | did:key — signer of the card statement, must be a party in the referenced record |
| snapshot? | string — display text ≤ 280 code points, plain text, labelled snapshot |
| displayState | enum — waiting \| posted \| superseded \| closed \| unverified |
| closedReason? | enum — accepted \| rejected \| withdrawn \| expired \| declined \| cancelled |
| statementCid | string — sha256 cid of the signed card statement |
| postedAtClaim | timestamp — poster clock, a claim |
| receivedAt? | timestamp — local clock for inbound cards |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most one card per (threadId, refId, refRevision); a newer refRevision posted in the same thread moves older cards of the same refId to superseded.
- displayState posted or closed implies refRevisionHash matched the locally held statement and posterDid is a party of that record.
- A card never changes the state of the referenced record; only owning-module events change displayState.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-063-09.T01 | unit | PS-063-01.R01, PS-063-01.R02, PS-063-01.R03, PS-063-02.R01 | B posts a card for offer O revision 1 | card stored posted with refRevisionHash equal to SHA-256 of JCS of O revision 1 and snapshot at most 280 characters |

## Dependencies

Module depends on: F08.S01.M01, F08.S01.M02, F01.S04.M01, F02.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
