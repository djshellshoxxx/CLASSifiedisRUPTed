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
| V01 | statement signature verifies and signer is the owner for proposals, releases and forfeit claims and the renter for agreements and responses | RENTALS_STATEMENT_INVALID |
| V02 | reservation is confirmed and not started, and no live terms exist for it | RENTALS_DEPOSIT_DUPLICATE |
| V03 | amount is positive, not above declaredValue, in the rent currency, and dueBy is not after startsAt | VALIDATION_FAILED |
| V04 | agreement names the cid of the current terms | RENTALS_DEPOSIT_TERMS_STALE |
| V05 | forfeit amount is positive, not above the funded amount, and evidence references are 1..10 | RENTALS_FORFEIT_EXCEEDS_DEPOSIT |
| V06 | forfeit claim or release is made after return attestation and within 30 days of it | RENTALS_DEPOSIT_WINDOW |
| V07 | release amount equals funded amount minus accepted retained amount | VALIDATION_FAILED |
| V08 | payment events reference a context of type rental_deposit that belongs to these terms with matching amount and currency | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-040-09.T01 | unit | PS-040-01.R01, PS-040-01.R02, PS-040-01.R03, PS-040-02.R03 | propose, supersede with new terms, agree on old cid | second proposal supersedes; agreement on old cid RENTALS_DEPOSIT_TERMS_STALE; amounts immutable |
| TEST-PS-040-09.T02 | unit | PS-040-02.R01, PS-040-02.R02 | each rule V01–V08 violated in turn | documented code returned and nothing stored; bad statements quarantined |
| TEST-PS-040-09.T16 | e2e | PS-040-01.R01, PS-040-02.R01 | mobile owner proposes, renter agrees and pays, owner acknowledges, release after return | funded then released in both vaults; non-custody notice shown; axe zero serious issues |

## Dependencies

Module depends on: F05.S01.M01, F09.S01.M01, F09.S02.M02, F09.S03.M01, F08.S01.M01, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
