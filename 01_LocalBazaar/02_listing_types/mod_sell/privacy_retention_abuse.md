# PS-006-07 — Privacy, retention and abuse: Sell listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M01 Sell listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/sell` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-006-07.R01** minOffer and drafts are P3 and never leave the vault; the public projection contains asking price, currencies, methods, negotiable and barterAcceptable flags and fulfilment options only.
- **PS-006-07.R02** No payment account, wallet address or contact detail may be stored in public fields; the screening is a safeguard, not a guarantee, and the UI says so.
- **PS-006-07.R03** Terms follow RET-STANDARD with the listing; deleted listings leave a tombstone for 180 days.
- **PS-006-07.R04** The module registers ExportSectionPort (section bazaar.sell_terms), DeletionPort and RetentionPurgePort with F10 (N6) and annotates every SellTerms field with its F10.S02.M02 class.

## Specification

**Data classification**
- SellTerms: P3 in draft, P0 for the projected subset; field classes annotated per F10.S02.M02.
- minOffer: P3, local only.

**Retention**
- SellTerms: RET-STANDARD; purged 30 days after the listing is deleted with a tombstone kept 180 days; price history is retained in ListingRevision (RET-EVIDENCE).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Seller publishes bank or wallet details to lure buyers off-platform or collect scams | free-text screening, no payment fields in schema, payment details exchanged only inside a Deal |
| T02 | Bait pricing: very low price then price rise | price-change rate limit of 10 per 24 h, material revision event, buyers must re-confirm |
| T03 | Floating-point or overflow price manipulation | integer string Money with a per-currency maximum of 10^10 major units from F09.S03.M03; strict parser |
| T04 | Minimum offer revealed to buyers | minOffer excluded from event and projection allowlists; offers below it look exactly like unanswered offers (F01.S04.M01); contract test enforces |

**Abuse controls**
- Price-change limit 10 per 24 h per listing; 200 sell-terms commands per hour per vault.
- Currency list capped at 5 per listing.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-006-09.T10 | abuse | PS-006-01.R02, PS-006-01.R03, PS-006-07.R01, PS-006-07.R02 | scan projection, events and logs; note with IBAN; schema search for payment instruction fields | no minOffer or drafts leave device; projected subset only after publish; note rejected; no payment instruction field exists |
| TEST-PS-006-09.T15 | integration | PS-006-07.R03 | delete listing P and advance the clock 29, 30 and 181 days | terms present on day 29, purged on day 30, tombstone present until day 180 and gone on day 181 |
| TEST-PS-006-09.T18 | integration | PS-006-07.R04 | export section, deletion plan and retention purge through the F10 ports | section bazaar.sell_terms present with field classes, minOffer marked P3; deletion plan purges own terms |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M02, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
