# PS-008-02 — Validation rules: Inventory availability

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S03.M01 Inventory availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/inventory/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-008-02.R01** Quantities, lease times and line counts are bounded and validated before any change.
- **PS-008-02.R02** A hold is accepted only when enough local availability exists for every line; otherwise nothing is held.
- **PS-008-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | quantity is an integer 1..100000 for hold lines and 0..100000 for set_quantity | VALIDATION_FAILED |
| V02 | 1 to 20 lines per hold call; no duplicate (listingId, variantId) | VALIDATION_FAILED |
| V03 | ttlMs between 60000 and 1209600000 | VALIDATION_FAILED |
| V04 | every line's item exists, is owned by the local principal and is not superseded | BAZAAR_INVENTORY_NOT_HOLDABLE |
| V05 | listing status is published, or unpublished when holderType is deal or cycle with an existing signed commitment | BAZAAR_INVENTORY_NOT_HOLDABLE |
| V06 | available >= quantity for every line | BAZAAR_INVENTORY_INSUFFICIENT |
| V07 | the vault has fewer than 500 active holds | BAZAAR_INVENTORY_HOLD_LIMIT |
| V08 | renewal keeps expiresAt <= maxExpiresAt and renewals < 20 | BAZAAR_INVENTORY_HOLD_LIFETIME |
| V09 | set_quantity does not drop onHand below reserved quantity | BAZAAR_INVENTORY_BELOW_RESERVED |
| V10 | hold is not frozen when converting or renewing | BAZAAR_INVENTORY_FROZEN |
| V11 | peer reservation statement signature verifies and signer is the listing owner of the referenced listing | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-008-09.T01 | unit | PS-008-01.R01, PS-008-01.R02, PS-008-02.R01, PS-008-02.R02 | hold 1 of L; hold 1 more | first held with expiry, second BAZAAR_INVENTORY_INSUFFICIENT; available never negative |
| TEST-PS-008-09.T03 | unit | PS-008-02.R03 | violate each rule V01-V11 | documented error code returned and no state change |

## Dependencies

Module depends on: F01.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
