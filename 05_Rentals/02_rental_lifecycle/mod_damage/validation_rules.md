# PS-041-02 — Validation rules: Rental damage claims

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M03 Rental damage claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/damage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-041-02.R01** Statements are validated in the order schema, signature, signer role, referenced cids, state, window, business rules.
- **PS-041-02.R02** The comparison basis is recomputed by the receiving vault from the two attested reports and must match the claim.
- **PS-041-02.R03** Every violation maps to one stable error code; quarantined statements store the code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | statement signature verifies and signer is the owner for claims, counter acceptances and withdrawals and the renter for responses | RENTALS_STATEMENT_INVALID |
| V02 | claim is filed within 7 days after return attestation, or for not_returned between 14 days overdue and 30 days after the reservation end | RENTALS_DAMAGE_WINDOW |
| V03 | basis lists at least one worsened or missing item, or kind is not_returned, and the receiver's recomputed basis equals the claimed basis | RENTALS_DAMAGE_NO_BASIS |
| V04 | items are 1..10, each description at most 300 code points with 1 to 5 evidence references, costs positive in the reservation currency | VALIDATION_FAILED |
| V05 | totalClaimed equals the sum of items and is not above ownerDeclaredValue | RENTALS_DAMAGE_EXCEEDS_VALUE |
| V06 | no claim of the same kind exists for the reservation | RENTALS_DAMAGE_DUPLICATE |
| V07 | counter amount is positive, below totalClaimed, and only one counter exists | RENTALS_DAMAGE_COUNTER_LIMIT |
| V08 | response arrives before respondBy by the receiver's clock plus 5 minutes | EXPIRED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-041-09.T01 | unit | PS-041-01.R01, PS-041-01.R02, PS-041-01.R03, PS-041-02.R03 | claim with 2 items summing to total and one whose sum is off by 1 minor unit | first stored with claim cid; second RENTALS_DAMAGE_EXCEEDS_VALUE or VALIDATION_FAILED |
| TEST-PS-041-09.T02 | unit | PS-041-02.R01, PS-041-02.R02 | each rule V01–V08 violated in turn | documented code returned and nothing stored; bad statements quarantined |
| TEST-PS-041-09.T03 | property | PS-041-02.R02, PS-041-03.R01 | random handoff and return checklists | worsened set equals the reference model; claims without worsened items refused; basis mismatch refused on receipt |
| TEST-PS-041-09.T16 | e2e | PS-041-01.R01, PS-041-02.R01 | mobile owner files claim, renter counters, owner accepts in two browsers | both show accepted with the same agreed amount; axe zero serious issues |

## Dependencies

Module depends on: F05.S02.M01, F05.S02.M02, F05.S01.M01, F05.S01.M02, F09.S01.M01, F09.S02.M02, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
