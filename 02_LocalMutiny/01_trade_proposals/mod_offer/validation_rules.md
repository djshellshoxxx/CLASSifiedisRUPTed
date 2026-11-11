# PS-013-02 — Validation rules: Barter offer items

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M03 Barter offer items](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/offer` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-013-02.R01** Legs are validated against the schema strictly, with business rules for ownership, availability, duplicates and limits evaluated before persistence.
- **PS-013-02.R02** The basis of every availability fact is recorded so the UI never presents a signed claim as local verification.
- **PS-013-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | items has 1..5 lines (exactly 1 with quantity 1 when subjectType is cycle) and each quantity is 1..99 | MUTINY_LEG_ITEMS_INVALID |
| V02 | giverId differs from receiverId and both are parties of the subject | MUTINY_LEG_PARTY_INVALID |
| V03 | own items exist in the local inventory, owned by the principal and quantity available ≥ requested, checked with bazaar.inventory.check on the InventoryPort line {listingId of the item's local listing, variantId?, quantity} | MUTINY_ITEM_UNAVAILABLE |
| V04 | other party's items have a verified, non-tombstoned listing projection authored by the giver and flagged barterAcceptable | MUTINY_ITEM_NOT_OWNED |
| V05 | no inventoryItemId occurs twice within the subject's legs | MUTINY_ITEM_DUPLICATE |
| V06 | subject has at most 8 legs | MUTINY_LEG_LIMIT |
| V07 | declaredValue is a positive Money of a registered currency, ≤ 1 000 000 000 000 minor units, and all lines of a leg share one currency | VALIDATION_FAILED |
| V08 | a leg can be voided only while status is defined | CONFLICT_STATE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-013-09.T01 | unit | PS-013-01.R01, PS-013-01.R02, PS-013-02.R01 | define 2-party legs with 2 and 1 lines | legs stored with listing revision hash, legValue computed, immutable fields unchanged afterwards |
| TEST-PS-013-09.T02 | unit | PS-013-02.R01, PS-013-02.R02, PS-013-02.R03 | each rule V01..V08 violated in turn | documented error code returned and nothing stored |
| TEST-PS-013-09.T04 | unit | PS-013-02.R02 | peer item without projection, with tombstoned projection, with valid projection | MUTINY_ITEM_NOT_OWNED, MUTINY_ITEM_NOT_OWNED, accepted with basis signed_listing |
| TEST-PS-013-09.T16 | e2e | PS-013-01.R03, PS-013-02.R03 | mobile user builds a 3-party ring leg set | each leg card readable, axe zero serious issues |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F02.S04.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
