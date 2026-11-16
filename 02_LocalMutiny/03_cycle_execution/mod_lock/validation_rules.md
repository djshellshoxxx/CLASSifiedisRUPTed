# PS-023-02 — Validation rules: Cycle locks

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M02 Cycle locks](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/lock` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-023-02.R01** Reserve validates ownership, availability, quantities and expiry range before any hold is taken, and takes all holds in one transaction or none.
- **PS-023-02.R02** Incoming reservation statements are verified for signature, signer role, digest binding and expiry before they count toward any commit verdict.
- **PS-023-02.R03** Conflict detection compares only data this vault legitimately holds and never claims knowledge of other vaults.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | items has 1..5 lines with quantity 1..99 and each item is owned by the principal with available quantity ≥ requested | MUTINY_LOCK_UNAVAILABLE |
| V02 | expiresAt = consentDeadline + executionWindowMs and ≤ now + 37 d | MUTINY_LOCK_EXPIRY_INVALID |
| V03 | the principal has fewer than 5 active own reservation sets | MUTINY_LOCK_LIMIT |
| V04 | revisionHash equals the subject's head revision hash | MUTINY_LOCK_REVISION_STALE |
| V05 | reservation signature verifies Ed25519 and giverId is the owner of the listed items per the signed listing projections and a giver in the head revision's legs | MUTINY_LOCK_STATEMENT_INVALID |
| V06 | peer reservation expiresAt ≥ head consentDeadline + executionWindowMs and is still in the future on the local clock | MUTINY_LOCK_STATEMENT_INVALID |
| V07 | no other active reservation of the same item for a different subject conflicts in quantity | MUTINY_LOCK_CONFLICT |
| V08 | release only by the reservation's signer and only while status is active | CONFLICT_STATE |
| V09 | issuedAtClaim is not more than 5 minutes after the local clock | MUTINY_LOCK_STATEMENT_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-023-09.T01 | unit | PS-023-01.R01, PS-023-01.R03, PS-023-02.R01 | reserve I1 and I2 | both holds active, statement signed, expiry equals deadline plus execution window |
| TEST-PS-023-09.T02 | unit | PS-023-02.R01, PS-023-02.R03 | each rule V01..V09 violated in turn | documented error code and no hold left behind |
| TEST-PS-023-09.T05 | integration | PS-023-02.R01, PS-023-06.R03 | reserve [I1, I2, I3] where I3 is unavailable | MUTINY_LOCK_UNAVAILABLE and I1, I2 holds absent |
| TEST-PS-023-09.T09 | integration | PS-023-02.R02, PS-023-07.R01 | peer statements: valid, bad signature, wrong signer, expiry too short, duplicated | only valid one stored; others quarantined; duplicate skipped |
| TEST-PS-023-09.T10 | integration | PS-023-07.R03, PS-023-02.R03 | peer double promise for one quantity-1 item in two subjects | both conflicted, conflict_detected emitted, both subjects frozen |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F07.S01.M01, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
