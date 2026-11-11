# PS-027-02 — Validation rules: Participant valuation

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M03 Participant valuation](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/valuation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-027-02.R01** Declarations are validated strictly on amount, currency, basis, ownership and lock state before anything is signed.
- **PS-027-02.R02** Plausibility thresholds are fixed numbers evaluated with integer arithmetic so every vault gets the same verdict.
- **PS-027-02.R03** Flags are accepted only from participants of a non-terminal proposal or cycle that contains the item, and acknowledgements need a justification.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | declared amount is a positive integer string within 1 and 1000000000000 and the currency is registered | VALIDATION_FAILED |
| V02 | the principal owns the inventory item and its listing is published and flagged barterAcceptable | MUTINY_VALUATION_ITEM_INVALID |
| V03 | basis is one of retail_estimate, purchase_price, replacement_cost, other and note ≤ 280 code points | VALIDATION_FAILED |
| V04 | the item has no active reservation (lockedBySubjectId absent) | MUTINY_VALUATION_LOCKED |
| V05 | ratioPermille below 200 gives plausibility low, above 5000 gives high, otherwise ok; no reference gives unchecked | VALIDATION_FAILED |
| V06 | flagger is a participant of a non-terminal proposal or cycle containing the item and has not flagged the same item within 30 days | MUTINY_VALUATION_FLAG_NOT_ALLOWED |
| V07 | acknowledgement is by the owner, the valuation is flagged, and ackNote has 10..280 code points | MUTINY_VALUATION_ACK_INVALID |
| V08 | peer projection signature verifies, signer equals ownerId, seq is greater than stored and prev equals stored cid, claimed time not more than 5 minutes ahead of the local clock | MUTINY_VALUATION_STATEMENT_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-027-09.T01 | unit | PS-027-01.R01, PS-027-02.R01, PS-027-02.R03 | declare 12000 EUR on I1 | stored with ratio 960 permille, plausibility ok, signed projection seq 1 |
| TEST-PS-027-09.T02 | unit | PS-027-02.R01, PS-027-02.R02 | each rule V01..V08 violated in turn | documented error code and nothing signed |
| TEST-PS-027-09.T03 | unit | PS-027-02.R02 | ratio 199, 200, 5000, 5001 permille and missing or foreign-currency reference | low, ok, ok, high, unchecked |

## Dependencies

Module depends on: F01.S02.M01, F01.S03.M01, F01.S01.M01, F09.S03.M01, F09.S03.M03, F16.S02.M03, F07.S01.M01, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
