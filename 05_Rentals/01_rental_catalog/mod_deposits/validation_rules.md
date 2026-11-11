# PS-040-02 — Validation rules: Rental deposits (noncustodial)

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M02 Rental deposits (noncustodial)](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/deposits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-040-02.R01** Statements are validated in the order schema, signature, signer role, referenced cids, state, business rules, and the first failure decides the error.
- **PS-040-02.R02** Amount rules compare integer minor units in one currency; no conversion is performed in this module.
- **PS-040-02.R03** Every violation maps to one stable error code with a localized message key; quarantined statements store the code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | statement signature verifies and signer is the owner for proposals, withdrawals, releases, forfeit claims and owner dispute notices, and the renter for agreements (comms.consent), declines, forfeit responses and renter dispute notices | RENTALS_STATEMENT_INVALID |
| V02 | reservation is confirmed and not started, and no live terms exist for it | RENTALS_DEPOSIT_DUPLICATE |
| V03 | amount is positive, not above declaredValue, declaredValue equals the value in the signed rental request, the currency is the rent currency, and dueBy is not after startsAt nor more than 75 days after the proposal | VALIDATION_FAILED |
| V04 | agreement names the cid of the current terms and comms.consent.verify returns valid for it | RENTALS_DEPOSIT_TERMS_STALE |
| V05 | forfeit amount is positive and not above the funded amount | RENTALS_FORFEIT_EXCEEDS_DEPOSIT |
| V06 | a forfeit claim is made after the return attestation, or for reason not_returned without one once rentals.rental.overdue has been held 14 days, and no later than the later of 30 days after the signed return attestation time (for not_returned, 30 days after overdue plus 14 days) and 14 days after rentals.damage.resolved for the reservation; releases are never time-barred | RENTALS_DEPOSIT_WINDOW |
| V07 | release amount equals the amount fixed by the path - the funded amount for a full release or a cancellation, the funded amount minus the accepted forfeit, or the mapped dispute amount | VALIDATION_FAILED |
| V08 | payment events match contextRef.type rental_deposit (funding) or rental_deposit_release (release) with id equal to this depositId, and the amount and currency of that Deal's obligation | VALIDATION_FAILED |
| V09 | forfeit evidence references are 1..10; damageClaimId is present for reason damage or missing_parts and for not_returned when a not_returned damage claim is recorded, refers to a claim recorded from rentals.damage.claimed for this reservation, no other forfeit references it, and when it is set the claim has been resolved with an agreedAmount and the forfeit amount is at most that agreedAmount | VALIDATION_FAILED |
| V10 | a forfeit for reason damage or missing_parts is refused while the return holds a verified return_waiver, read through the WaiverStatusPort that F05.S02.M02 registers | RENTALS_DEPOSIT_WINDOW |
| V11 | a forfeit response has createdAt not after the claim's signed respondBy and is received within 72 h of its createdAt | EXPIRED |
| V12 | an agreement received after a verified withdrawal or decline of the same termsCid is refused in both vaults | CONFLICT_STATE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-040-09.T01 | unit | PS-040-01.R01, PS-040-01.R02, PS-040-01.R03, PS-040-02.R03 | propose, supersede with new terms, agree on old cid | second proposal supersedes; agreement on old cid RENTALS_DEPOSIT_TERMS_STALE; amounts immutable |
| TEST-PS-040-09.T02 | unit | PS-040-02.R02, PS-040-02.R03 | each rule V01–V12 violated in turn with every other check passing | the documented code is returned and nothing stored; bad statements quarantined with that code |
| TEST-PS-040-09.T17 | unit | PS-040-02.R01 | inbound forfeit claim with a bad signature and a stale state; inbound response with a wrong signer and an amount above the funded deposit | RENTALS_STATEMENT_INVALID for both; the later failures are never reported |
| TEST-PS-040-09.T20 | integration | PS-040-02.R02, PS-040-03.R05 | not_returned forfeit without return attestation at overdue day 13 and day 15; damage resolved on day 40 after return and forfeit on day 50; forfeit for damage after a verified return_waiver; forfeit for damage above the agreedAmount of its resolved claim; not_returned forfeit without the recorded not_returned damage claim id | RENTALS_DEPOSIT_WINDOW on day 13; allowed on day 15; allowed until 14 days after the resolution; waiver case refused with RENTALS_DEPOSIT_WINDOW; the last two refused with VALIDATION_FAILED |

## Dependencies

Module depends on: F05.S01.M01, F09.S01.M01, F09.S01.M03, F09.S02.M02, F09.S03.M01, F09.S03.M03, F08.S01.M01, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
