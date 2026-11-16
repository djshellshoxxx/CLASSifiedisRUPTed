# PS-043-02 — Validation rules: Rental return

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M02 Rental return](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/return` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-043-02.R01** Statements are validated in the order schema, signature, signer role, reservation and report cids, state, business rules.
- **PS-043-02.R02** Late-fee computation uses elapsed UTC time and the terms copied at confirmation, never terms edited later.
- **PS-043-02.R03** Every violation maps to one stable error code; quarantined statements store the code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | statement signature verifies and signer is the renter for return reports and the owner for attestations, receipts, fee adjustments and waivers | RENTALS_STATEMENT_INVALID |
| V02 | handoff for the reservation is attested and the return is in state due, overdue or awaiting_owner as the command requires | CONFLICT_STATE |
| V03 | checklist has at most 30 items, photos at most 20 each with a SHA-256, notes at most 1000 code points | VALIDATION_FAILED |
| V04 | attestation names the cid of the latest return report | RENTALS_REPORT_STALE |
| V05 | late fee adjustment is not higher than the current fee and not below zero | RENTALS_FEE_ADJUST_INVALID |
| V06 | closure is attempted only when attested, the damage window is over or waived, no damage claim is open and a funded deposit is settled | PRECONDITION_FAILED |
| V07 | returnedAtClaim is not later than local receipt time plus 5 minutes | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-043-09.T01 | unit | PS-043-01.R01, PS-043-01.R02, PS-043-01.R03, PS-043-02.R02 | returns at +30 min, +130 min after grace, +20 h and across a DST change | lateMinutes 0, 130 with fee 15.00, capped at 40.00; elapsed UTC time used |
| TEST-PS-043-09.T02 | unit | PS-043-02.R01, PS-043-02.R03 | each rule V01–V07 violated in turn | documented code returned and nothing stored; bad statements quarantined |
| TEST-PS-043-09.T03 | property | PS-043-02.R02, PS-043-03.R02 | random return times, rates, caps and adjustments against reference model | fee equals model, never above cap, adjustments only decrease |
| TEST-PS-043-09.T15 | e2e | PS-043-01.R01, PS-043-02.R01 | mobile renter returns 2 h late, owner attests in second browser | late fee preview matches, both show attested; axe zero serious issues |

## Dependencies

Module depends on: F05.S02.M01, F05.S01.M01, F05.S01.M02, F09.S01.M01, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
