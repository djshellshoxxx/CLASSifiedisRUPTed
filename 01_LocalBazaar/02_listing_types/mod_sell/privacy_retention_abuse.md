# PS-006-07 — Privacy, retention and abuse: Sell listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M01 Sell listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/sell` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-006-07.R01** minOffer and drafts are P3 and never leave the vault; the public projection contains asking price, currencies, methods, negotiable flag and fulfilment options only.
- **PS-006-07.R02** No payment account, wallet address or contact detail may be stored in public fields; the screening is a safeguard, not a guarantee, and the UI says so.
- **PS-006-07.R03** Terms follow RET-STANDARD with the listing; deleted listings leave a tombstone for 180 days.

## Specification

**Data classification**
- SellTerms: P3 in draft, P0 for the projected subset.
- minOffer: P3, local only.

**Retention**
- SellTerms: RET-STANDARD; purged with the listing; price history is retained in ListingRevision (RET-EVIDENCE).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Seller publishes bank or wallet details to lure buyers off-platform or collect scams | free-text screening, no payment fields in schema, payment details exchanged only inside a Deal |
| T02 | Bait pricing: very low price then price rise | price-change rate limit of 10 per 24 h, material revision event, buyers must re-confirm |
| T03 | Floating-point or overflow price manipulation | integer string Money with maximum 1e12 minor units; strict parser |
| T04 | Minimum offer revealed to buyers | minOffer excluded from event and projection allowlists; contract test enforces |

**Abuse controls**
- Price-change limit 10 per 24 h per listing; 200 sell-terms commands per hour per vault.
- Currency list capped at 5 per listing.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-006-09.T10 | abuse | PS-006-07.R01, PS-006-07.R02 | scan projection, events and logs; note with IBAN | no minOffer or drafts leave device; note rejected |
| TEST-PS-006-09.T11 | abuse | PS-006-07.R03, PS-006-02.R03 | 11 price changes within 24 h | 11th returns RATE_LIMITED with retryAfterMs |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M02, F09.S03.M01, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
