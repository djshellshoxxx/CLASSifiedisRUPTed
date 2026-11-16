# PS-011-04 — Commands, queries and events: Purchase offers

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M01 Purchase offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/offers` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-011-04.R01** The module exposes make, accept, reject and withdraw commands and two queries with the signatures below.
- **PS-011-04.R02** Every command emits exactly the listed events in the same transaction as the state change.
- **PS-011-04.R03** The module consumes listing, inventory and block events to keep open offers consistent.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `bazaar.offer.make` | bazaar.offer.make | { listingId, variantId?, amount: Money, note?, expiresInMs? (default 172800000) } | { offerId, revision: 1, expiresAt, syncState: prepared } | VALIDATION_FAILED, BAZAAR_LISTING_NOT_OFFERABLE, BAZAAR_OFFER_CURRENCY_NOT_ACCEPTED, BAZAAR_OFFER_SELF, BLOCKED_PARTY, BAZAAR_OFFER_DUPLICATE, BAZAAR_OFFER_LIMIT, RATE_LIMITED | bazaar.offer.made | yes (Idempotency-Key) |
| `bazaar.offer.accept` | bazaar.offer.accept | { offerId, expectedRevision } | { offerId, revision, dealId, holdId } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, BAZAAR_OFFER_HOLD_FAILED, EXPIRED | bazaar.offer.accepted, bazaar.offer.expired | yes (Idempotency-Key) |
| `bazaar.offer.reject` | bazaar.offer.reject | { offerId, expectedRevision } | { offerId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | bazaar.offer.rejected | yes (Idempotency-Key) |
| `bazaar.offer.withdraw` | bazaar.offer.withdraw | { offerId, expectedRevision } | { offerId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | bazaar.offer.withdrawn | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `bazaar.offer.list_for_listing` | bazaar.offer.read_as_seller | { listingId, status?: made\|all, sort?: amount_desc\|created_desc, cursor?, limit ≤ 50 } | { items: Offer[], nextCursor? } | NOT_FOUND |
| `bazaar.offer.list_mine` | bazaar.offer.read_own | { status?, cursor?, limit ≤ 50 } | { items: Offer[], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `bazaar.offer.made` | P2 | { offerId, listingId, variantId?, buyerId, sellerId, amount, expiresAt } |
| `bazaar.offer.accepted` | P2 | { offerId, listingId, variantId?, buyerId, sellerId, amount, dealId, holdId } |
| `bazaar.offer.rejected` | P2 | { offerId, listingId, buyerId, reason } |
| `bazaar.offer.withdrawn` | P2 | { offerId, listingId, sellerId } |
| `bazaar.offer.expired` | P2 | { offerId, listingId, buyerId, sellerId, reason } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.listing.edited` | set listingChangedSinceOffer=true on open offers when the edit is material |
| `bazaar.listing.unpublished` | expire open offers with reason listing_unavailable |
| `bazaar.listing.expired` | expire open offers with reason listing_unavailable |
| `bazaar.inventory.depleted` | expire open offers on the variant with reason superseded |
| `identity.block.added` | reject open offers between the two parties with reason blocked |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| BAZAAR_LISTING_NOT_OFFERABLE | 409 | no | listing is not published, not a sell listing, or expired |
| BAZAAR_OFFER_CURRENCY_NOT_ACCEPTED | 422 | no | listing does not accept the offer currency |
| BAZAAR_OFFER_SELF | 422 | no | a seller cannot offer on their own listing |
| BAZAAR_OFFER_DUPLICATE | 409 | no | buyer already has an open offer on this listing variant |
| BAZAAR_OFFER_LIMIT | 409 | no | listing reached 50 open offers |
| BAZAAR_OFFER_HOLD_FAILED | 409 | no | inventory could not be held; offer remains open |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Execution sites (ADR-0016): make and withdraw are vault commands in the buyer vault that emit signed statements to the seller; accept and reject are vault commands in the seller vault that emit signed statements to the buyer; the receiving vault verifies signer role (buyer for make/withdraw, listing author for accept/reject) and applies the same transition locally. Relays only carry the encrypted envelopes.

### Example

```
POST /api/v1/cmd/bazaar.offer.make
Idempotency-Key: 0192f3a4-0000-7000-8000-000000000001
{ "listingId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "amount": { "amount": "4500", "currency": "EUR" } }
201 { "offerId": "0192f3a5-…", "revision": 1, "expiresAt": "2026-11-06T10:00:00.000Z" }
POST /api/v1/cmd/bazaar.offer.accept  { "offerId": "0192f3a5-…", "expectedRevision": 1 }
200 { "offerId": "0192f3a5-…", "revision": 2, "dealId": "0192f3a6-…", "holdId": "0192f3a6-…" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-011-09.T06 | contract | PS-011-04.R01, PS-011-04.R02, PS-011-09.R02 | each command executes | output and emitted event payloads validate against registry schemas |
| TEST-PS-011-09.T07 | integration | PS-011-04.R03 | listing unpublished and block added events delivered | open offers expire or reject with documented reasons |
| TEST-PS-011-09.T17 | e2e | PS-011-01.R02, PS-011-04.R01 | mobile buyer makes offer, seller accepts on another device | both see accepted state; screen passes axe with zero serious issues |

## Dependencies

Module depends on: F01.S01.M03, F01.S02.M01, F01.S03.M01, F09.S01.M01, F09.S03.M03, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
