# PS-006-10 — Import, export, backup and rollback: Sell listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M01 Sell listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/sell` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-006-10.R01** The user export contains SellTerms of own listings in section bazaar.sell_terms.
- **PS-006-10.R02** Import validates Money, currencies and the one-terms-per-listing rule, and rejects terms for listings that are not own sell listings.
- **PS-006-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section bazaar.sell_terms in classrup-export/v1, one line per SellTerms (schema classrup.bazaar.sell_terms/v1), including minOffer because the export goes to the owner only.
- **import:** Unknown currencies keep the record read-only with a warning; duplicates by listing id are rejected; minOffer stays local.
- **backup:** Vault export is the primary backup (IOX-6); relays hold only the public subset inside listing projections.
- **migration rollback:** Additive optional fields only in v1; rollback is by reinstalling the previous release; older readers ignore new fields.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-006-09.T14 | integration | PS-006-10.R01, PS-006-10.R02, PS-006-10.R03 | export, import to fresh vault, import terms for listing of another owner | round-trip identical; foreign terms rejected |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M02, F09.S03.M01, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
