# PS-011-04 — Commands, queries and events: Purchase offers

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M01 Purchase offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/offers` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-011-04.R01** The module exposes the vault commands make, receive, accept, reject, withdraw and resolve_conflict and two queries with the signatures below.
- **PS-011-04.R02** Every command emits exactly the listed events in the same transaction as the state change.
- **PS-011-04.R03** In the seller vault the module consumes listing, inventory and block events to keep open offers consistent; in the buyer vault it consumes verified mirror updates (federation.record.accepted, federation.tombstone.applied) and consent events instead of bazaar.listing.* events.
- **PS-011-04.R04** Statements and signer roles are registered with F11.S01.M01 (N2): classrup.bazaar.offer/v1 and classrup.bazaar.offer_withdrawal/v1 signed by the buyer, classrup.bazaar.offer_decision/v1 signed by the listing author; the vault acts only on statements this module or F08.S02.M02 accepted.
- **PS-011-04.R05** Acceptance is signed with comms.consent.sign {subjectType bazaar_offer, subjectRef offerId, subjectRevision 1, subjectRevisionHash = SHA-256 of JCS of the offer statement, statementKey consent.bazaar.offer.accept.v1} and verified with comms.consent.verify; the module registers the SubjectCanonicalizerPort for bazaar_offer, and a conflicted status freezes the offer (N13).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `bazaar.offer.make` | bazaar.offer.make | [vault-local in the buyer vault + statement classrup.bazaar.offer/v1, encrypted to the seller's mailbox hint from the verified projection] { listingId, listingCid, variantId?, quantity? (1..100, default 1), amount: Money, note?, expiresInMs? (default 172800000) } | { offerId, revision: 1, expiresAt, offerCid, syncState: prepared } | VALIDATION_FAILED, NOT_FOUND, BAZAAR_LISTING_NOT_OFFERABLE, BAZAAR_OFFER_CURRENCY_NOT_ACCEPTED, BAZAAR_OFFER_SELF, BLOCKED_PARTY, BAZAAR_OFFER_DUPLICATE, RATE_LIMITED | bazaar.offer.made | yes (Idempotency-Key) |
| `bazaar.offer.receive` | bazaar.offer.receive | [vault-local, inbound statement] { envelope: classrup.bazaar.offer/v1 \| classrup.bazaar.offer_withdrawal/v1 \| classrup.bazaar.offer_decision/v1, provenance } | { offerId?, accepted: boolean, status?, quarantineReason?: signature_invalid\|role_mismatch\|binding_mismatch\|unknown_offer\|duplicate } | VALIDATION_FAILED, UNSUPPORTED_SCHEMA_VERSION, CONFLICT_STATE, RATE_LIMITED | bazaar.offer.made, bazaar.offer.rejected, bazaar.offer.withdrawn, bazaar.offer.expired | yes (Idempotency-Key) |
| `bazaar.offer.accept` | bazaar.offer.accept | [vault-local in the seller vault; produces classrup.comms.consent/v1 (comms.consent.sign), classrup.commerce.deal/v1 (commerce.deal.open {contextRef {type: offer, id: offerId}, contextCid: offerCid, parties [buyer, seller], obligations [{payer buyer, payee seller, amount, purpose goods}]}) and classrup.bazaar.reservation/v1 (bazaar.inventory.issue_reservation to the buyer)] { offerId, expectedRevision } | { offerId, revision, dealId, holdId, consentCid, reservationCid } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, BAZAAR_OFFER_HOLD_FAILED, EXPIRED, DEPENDENCY_UNAVAILABLE, COMMERCE_DEAL_CONTEXT_CONFLICT, COMMS_CONSENT_SUBJECT_MISMATCH | bazaar.offer.accepted, bazaar.offer.expired | yes (Idempotency-Key) |
| `bazaar.offer.reject` | bazaar.offer.reject | [vault-local + statement classrup.bazaar.offer_decision/v1 except for countered] { offerId, expectedRevision, reason?: seller_rejected\|countered (default seller_rejected; countered only from F01.S04.M02) } | { offerId, revision, decisionCid? } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED | bazaar.offer.rejected | yes (Idempotency-Key) |
| `bazaar.offer.withdraw` | bazaar.offer.withdraw | [vault-local in the buyer vault + statement classrup.bazaar.offer_withdrawal/v1] { offerId, expectedRevision } | { offerId, revision, withdrawalCid, syncState: prepared } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | bazaar.offer.withdrawn | yes (Idempotency-Key) |
| `bazaar.offer.resolve_conflict` | bazaar.offer.resolve_conflict | [vault-local in the seller vault + statement classrup.bazaar.offer_decision/v1 to each dropped buyer] { keepOfferId, dropOfferIds[1..10] } | { keptOfferId, dropped: [{ offerId, decisionCid, cancelledDealId }] } | NOT_FOUND, CONFLICT_STATE, DEPENDENCY_UNAVAILABLE | bazaar.offer.rejected | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `bazaar.offer.list_for_listing` | bazaar.offer.read_as_seller | { listingId, status?: made\|all, sort?: amount_desc\|created_desc, includeHidden? (internal callers only), cursor?, limit ≤ 50 } | { items: Offer[], nextCursor? } | NOT_FOUND |
| `bazaar.offer.list_mine` | bazaar.offer.read_own | { status?, cursor?, limit ≤ 50 } | { items: Offer[], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `bazaar.offer.made` | P2 | { offerId, listingId, variantId?, quantity, buyerId, sellerId, amount, expiresAt, localRole } |
| `bazaar.offer.accepted` | P2 | { offerId, listingId, variantId?, quantity, buyerId, sellerId, amount, dealId, holdId?, localRole } |
| `bazaar.offer.rejected` | P2 | { offerId, listingId, buyerId, sellerId, reason, localRole } |
| `bazaar.offer.withdrawn` | P2 | { offerId, listingId, buyerId, sellerId, reason: buyer_withdrew\|blocked, dealId?, localRole } |
| `bazaar.offer.expired` | P2 | { offerId, listingId, buyerId, sellerId, reason, dealId?, localRole } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.listing.edited` | seller vault: set listingChangedSinceOffer=true on open offers when the edit is material |
| `bazaar.listing.unpublished` | seller vault: expire open offers with reason listing_unavailable and queue a signed decision to each buyer, including hidden below-minimum offers still before expiresAt |
| `bazaar.listing.expired` | seller vault: expire open offers with reason listing_unavailable and queue signed decisions as for unpublish |
| `bazaar.listing.closed` | seller vault: expire open offers with reason listing_unavailable and queue signed decisions as for unpublish |
| `bazaar.inventory.depleted` | seller vault: expire open offers on the variant with reason superseded and queue signed decisions, including hidden below-minimum offers still before expiresAt |
| `bazaar.inventory.conflict_detected` | seller vault: accepted offers whose holdId is named move to frozen; the owner resolves with bazaar.offer.resolve_conflict |
| `identity.block.added` | seller vault: reject open offers from the blocked buyer with local reason blocked and a decision statement with reason seller_rejected; buyer vault: withdraw open offers to the blocked seller with a withdrawal statement |
| `federation.record.accepted` | buyer vault: a newer verified projection of an offered listing (author = sellerId) sets listingChangedSinceOffer when its listingRevision is higher with material changes, and listingUnavailable when the variant is no longer in stock or expiresAt passed |
| `federation.tombstone.applied` | buyer vault: a tombstone of the offered listing's projection sets listingUnavailable; the offer stays made until the seller's decision or the grace ends |
| `comms.consent.received` | buyer vault: for subjectType bazaar_offer and subjectRef offerId, call comms.consent.verify for signerDid = sellerId over offerCid; valid within expiresAt + 24 h moves made to accepted (later answers with a timeout close), conflicted moves accepted to frozen, stale or revoked is ignored |
| `commerce.deal.cancelled` | frozen offers whose dealId matches move to expired with reason timeout |
| `privacy.deletion.completed` | replace the deleted principal's DID with the payload pseudonym in offers retained under RET-EVIDENCE and purge notes of non-evidence offers |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| BAZAAR_LISTING_NOT_OFFERABLE | 409 | no | listing is not published, not a sell listing, or expired |
| BAZAAR_OFFER_CURRENCY_NOT_ACCEPTED | 422 | no | listing does not accept the offer currency |
| BAZAAR_OFFER_SELF | 422 | no | a seller cannot offer on their own listing |
| BAZAAR_OFFER_DUPLICATE | 409 | no | buyer already has an open offer on this listing variant |
| BAZAAR_OFFER_LIMIT | 409 | no | listing reached 50 open offers |
| BAZAAR_OFFER_HOLD_FAILED | 409 | no | inventory could not be held; offer remains open |
| BAZAAR_OFFER_BELOW_MINIMUM | 422 | no | seller vault only: the offer is below the private minimum; stored rejected and hidden, never reported to the buyer |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Execution sites (ADR-0016): make and withdraw are vault commands in the buyer vault; accept, reject and resolve_conflict are vault commands in the seller vault; receive runs in both. Statements (N2, registered with F11.S01.M01): classrup.bazaar.offer/v1 {offerId, listingId, listingCid, listingRevision, variantId?, quantity, amount, expiresAt, note?, buyerMailboxHint}, signer role buyer (buyerId); classrup.bazaar.offer_withdrawal/v1 {offerId, offerCid, reason: buyer_withdrew|timeout}, signer role buyer; classrup.bazaar.offer_decision/v1 {offerId, offerCid, outcome: rejected|expired, reason: seller_rejected|listing_full|listing_unavailable|superseded|conflict_resolved}, signer role listing author; acceptance classrup.comms.consent/v1 (F08.S02.M02, statementKey consent.bazaar.offer.accept.v1), signer role listing author, plus classrup.commerce.deal/v1 (F09.S01.M01) and classrup.bazaar.reservation/v1 (F01.S03.M01). Countered is implied by the first negotiation round whose prev is the offerCid; below_minimum and timeout produce no decision. Relays only carry the encrypted envelopes. Privacy ports (N6): the module registers ExportSectionPort (section bazaar.offers), DeletionPort (plan: pseudonymize the deleted party's DID in retained offers, purge notes of non-evidence offers) and RetentionPurgePort (purge after RET-EVIDENCE) with F10.S01.M03, F10.S01.M04 and F10.S01.M02.

### Example

```
buyer vault: vault.dispatch("bazaar.offer.make", { "listingId": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "listingCid": "sha256-Lst...",
  "amount": { "amount": "4500", "currency": "EUR" } }, idempotencyKey: "0192f3a4-0000-7000-8000-000000000001")
=> { "offerId": "0192f3a5-…", "revision": 1, "expiresAt": "2026-11-06T10:00:00.000Z", "offerCid": "sha256-Ofr...", "syncState": "prepared" }
   sync outbox: encrypted classrup.bazaar.offer/v1 signed by the buyer key, addressed to the seller's mailbox hint
seller vault: vault.dispatch("bazaar.offer.receive", { "envelope": { "type": "classrup.bazaar.offer/v1", "author": "did:key:z6MkBuyer...", ... } })
=> { "offerId": "0192f3a5-…", "accepted": true, "status": "made" }
seller vault: vault.dispatch("bazaar.offer.accept", { "offerId": "0192f3a5-…", "expectedRevision": 1 }, idempotencyKey: "0192f3a4-0000-7000-8000-000000000002")
=> { "offerId": "0192f3a5-…", "revision": 2, "dealId": "0192f3a6-…", "holdId": "0192f3a6-…", "consentCid": "sha256-Cns...", "reservationCid": "sha256-Rsv..." }
   sync outbox: encrypted classrup.comms.consent/v1 (consent.bazaar.offer.accept.v1), classrup.commerce.deal/v1 and classrup.bazaar.reservation/v1 to the buyer
buyer vault: comms.consent.received → comms.consent.verify { subjectType: "bazaar_offer", subjectRef: "0192f3a5-…", signerDid: seller } = valid → offer accepted
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-011-09.T06 | contract | PS-011-04.R01, PS-011-04.R02, PS-011-09.R02 | each command executes | output and emitted event payloads validate against registry schemas |
| TEST-PS-011-09.T07 | integration | PS-011-04.R03 | seller vault: listing unpublished and block added; buyer vault: newer verified projection and a tombstone | seller expires or rejects with documented reasons and signed decisions; buyer sets listingChangedSinceOffer and listingUnavailable from mirror events and consumes no bazaar.listing.* event |
| TEST-PS-011-09.T17 | e2e | PS-011-04.R01 | mobile buyer makes an offer, seller accepts in its vault | both vaults show accepted with the same dealId; screen passes axe with zero serious issues |
| TEST-PS-011-09.T19 | contract | PS-011-01.R04, PS-011-04.R04 | make, decide and withdraw; inspect stored records and the F11.S01.M01 registry | statements validate as classrup.bazaar.offer/v1, offer_decision/v1 and offer_withdrawal/v1 with registered signer roles; records validate as classrup.bazaar.offer_record/v1 only |
| TEST-PS-011-09.T26 | integration | PS-011-04.R05 | accept, then a conflicted consent status in B1 | consent signed with subjectType bazaar_offer, statementKey consent.bazaar.offer.accept.v1 over the offer digest through the registered SubjectCanonicalizerPort; B1 verifies with comms.consent.verify; conflicted moves B1's offer to frozen |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F01.S02.M01, F01.S03.M01, F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F08.S02.M02, F11.S01.M01, F11.S01.M02, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
