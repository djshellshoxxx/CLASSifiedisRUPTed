# PS-011-02 — Validation rules: Purchase offers

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M01 Purchase offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/offers` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-011-02.R01** Offer input is validated strictly against the schema; unknown fields are rejected with VALIDATION_FAILED.
- **PS-011-02.R02** Business rules check listing state, currency acceptance, self-dealing, blocks and open-offer caps before persistence; each rule names the vault that runs it, the buyer vault evaluating against the verified listing projection (F11.S01.M02 mirror view) and the seller vault against its own records.
- **PS-011-02.R03** Every rule violation maps to exactly one stable error code with a localized message key.
- **PS-011-02.R04** On receipt in the seller vault an offer below SellTerms.minOffer is stored as rejected with reason below_minimum and hidden from the seller list; the buyer sees exactly what an unanswered offer shows: the same peer acknowledgement, no rejection statement and expiry at expiresAt with reason timeout.
- **PS-011-02.R05** Inbound statements are verified before they change state: Ed25519 over JCS, signer = buyerId for offer and withdrawal statements, signer = author of the verified listing projection for decisions, decisions and withdrawals bound to the offer statement cid, cid deduplication; failures are quarantined with signature_invalid, role_mismatch or binding_mismatch.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | both vaults: amount.amount is a positive integer string <= maxAmount(amount.currency) and amount.currency is registered (F09.S03.M01) | VALIDATION_FAILED |
| V02 | buyer vault: the verified listing projection exists, is kind sell, is not tombstoned and is before its expiresAt; seller vault receive: own Listing (F01.S01.M01) is published, kind sell and not expired, and listingCid names a projection this vault signed | BAZAAR_LISTING_NOT_OFFERABLE |
| V03 | buyer vault: amount.currency is in the projection's acceptedCurrencies; seller vault: bazaar.sell_terms.accepts | BAZAAR_OFFER_CURRENCY_NOT_ACCEPTED |
| V04 | both vaults: buyerId != listing author | BAZAAR_OFFER_SELF |
| V05 | both vaults: neither party has blocked the other (F07.S02.M02 isBlockedEither); the seller vault drops statements from blocked DIDs silently (N7) | BLOCKED_PARTY |
| V06 | buyer vault: no other own open offer on the same listing variant; seller vault: unique open index | BAZAAR_OFFER_DUPLICATE |
| V07 | seller vault receive: listing has fewer than 50 open offers; the 51st receives a signed decision rejected with reason listing_full | BAZAAR_OFFER_LIMIT |
| V08 | buyer vault: expiresAt between now+1h and now+7d; seller vault: the claimed expiresAt is at most 7 d plus 10 min after receipt | VALIDATION_FAILED |
| V09 | variantId present iff the listing has variants (buyer: variants of the verified projection; seller: F01.S03.M01 items), the variant is in stock (buyer: inStock flag; seller: available >= quantity) | VALIDATION_FAILED |
| V10 | both vaults receive: signature verifies Ed25519 over JCS; offer and withdrawal signed by buyerId; decision signed by the author of the verified listing projection; decision and withdrawal carry the offerCid of a stored offer | VALIDATION_FAILED |
| V11 | both vaults: quantity is an integer 1..100 | VALIDATION_FAILED |
| V12 | seller vault receive: amount >= SellTerms.minOffer in the same currency, else stored rejected with reason below_minimum, hidden, no statement and no event | BAZAAR_OFFER_BELOW_MINIMUM |
| V13 | seller vault accept: now < expiresAt on the seller clock | EXPIRED |
| V14 | buyer vault: an acceptance is applied only when comms.consent.verify returns valid for signerDid = listing author over this offer's statement digest, no later than expiresAt + 24 h on the buyer clock; later acceptances are answered with a timeout withdrawal | EXPIRED |
| V15 | seller vault receive: at most 20 offers per listing per hour from keys this vault has never seen; excess statements are dropped without acknowledgement | RATE_LIMITED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-011-09.T01 | unit | PS-011-01.R01, PS-011-01.R03, PS-011-02.R01 | make offer with valid input | Offer stored with status made, revision 1, amount and quantity unchanged, offerCid set |
| TEST-PS-011-09.T02 | unit | PS-011-02.R02, PS-011-02.R03 | each rule V01–V15 violated in turn in the vault the rule names | the documented error code is returned or the statement is quarantined or dropped; nothing is stored |
| TEST-PS-011-09.T20 | abuse | PS-011-02.R04 | two buyer keys bisect minOffer with amounts above and below EUR 35.00 | identical acknowledgement, no rejection statement and timeout expiry for every unanswered probe; below-minimum offers hidden from S's list; the probes learn nothing beyond not accepted |
| TEST-PS-011-09.T21 | abuse | PS-011-02.R05 | decision signed by K; withdrawal signed by B2 for B1's offer; decision for offer A replayed onto offer B; acceptance consent for offer A replayed onto offer B | quarantined role_mismatch, role_mismatch, binding_mismatch; comms.consent.verify reports a subject mismatch; offer B stays made |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F01.S02.M01, F01.S03.M01, F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F08.S02.M02, F11.S01.M01, F11.S01.M02, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
