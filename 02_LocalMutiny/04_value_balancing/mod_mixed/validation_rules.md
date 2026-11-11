# PS-026-02 — Validation rules: Mixed-value compensation

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M01 Mixed-value compensation](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/mixed` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-026-02.R01** Compensation legs are validated for parties, currency, amount bounds and consistency with the subject's normalization before they can be sealed in a revision.
- **PS-026-02.R02** Claims are accepted only from the payer for a due leg and acknowledgements only from the payee for a claimed leg, through F09.
- **PS-026-02.R03** Crypto claims are never presented as paid without chain finality evidence, and a missing verifier leaves them claimed.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | payer and payee are distinct participants of the subject | MUTINY_COMPENSATION_PARTY_INVALID |
| V02 | amount is a positive integer within 1 and 1000000000000 minor units in the subject's settlement currency | VALIDATION_FAILED |
| V03 | kind money has methods of 1..3 values from cash, crypto, external; kind extra_item has extraLegId referencing a leg of the subject | VALIDATION_FAILED |
| V04 | at most N minus 1 money legs per subject where N is the participant count, at most 8 legs | MUTINY_COMPENSATION_LIMIT |
| V05 | a leg may be proposed only while the subject is a draft or open proposal, a proposed cycle, or an open RecoveryCase (subjectType recovery_case, proposed by a participant through F02.S03.M04), and by an allowed author | MUTINY_COMPENSATION_NOT_ALLOWED |
| V06 | claim is made by the payer, the leg is due, and the cycle is committed or executing or partially_executed | MUTINY_COMPENSATION_CLAIM_NOT_ALLOWED |
| V07 | claimRef is at most 128 characters and contains no URL query secrets; method is one of the leg methods | VALIDATION_FAILED |
| V08 | withdraw only while status is proposed and the leg is not referenced by a sealed head revision | CONFLICT_STATE |
| V09 | activate only for a recovery_case leg whose option F02.S03.M04 recorded as accepted by both payer and payee | MUTINY_COMPENSATION_NOT_ALLOWED |
| V10 | amount, payer, payee and kind of a leg referenced by a sealed revision or an accepted recovery option are never changed; any change request is refused and needs a new revision or option | CONFLICT_STATE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-026-09.T02 | property | PS-026-01.R03, PS-026-02.R03 | random value vectors for 2..8 participants | sum of payments conserved, at most N-1 legs, residuals within tolerance, deterministic output |
| TEST-PS-026-09.T03 | unit | PS-026-02.R01, PS-026-02.R02 | each rule V01..V10 violated in turn | documented error code and nothing stored |
| TEST-PS-026-09.T07 | integration | PS-026-01.R04, PS-026-02.R03 | crypto claim without verifier | stays claimed, never settled; cycle cannot complete; recovery waiver path available |
| TEST-PS-026-09.T21 | unit | PS-026-01.R02, PS-026-02.R01 | change amount or payer of a leg sealed by the head revision after commit | refused with CONFLICT_STATE (V10); leg unchanged; consented digest still matches |

## Dependencies

Module depends on: F02.S04.M02, F02.S04.M03, F02.S02.M03, F09.S01.M01, F09.S01.M03, F09.S02.M02, F09.S03.M03, F16.S02.M03, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
