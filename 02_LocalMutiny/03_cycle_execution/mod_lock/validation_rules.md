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
| V01 | items has 1..5 lines with quantity 1..99, each is an InventoryPort line {inventoryItemId, quantity} of an item owned by the principal, and bazaar.inventory.hold succeeds for all lines at once | MUTINY_LOCK_UNAVAILABLE |
| V02 | expiresAt = min(consentDeadline + executionWindowMs, now + 30 d) and the head revision satisfies the F02.S01.M04 V09 cap ((consentDeadline − revision time) + executionWindowMs ≤ 30 d), so expiresAt normally equals consentDeadline + executionWindowMs; the hold is taken with ttlMs = min(expiresAt − now, 14 d) | MUTINY_LOCK_EXPIRY_INVALID |
| V03 | the principal has fewer than 5 active own reservation sets | MUTINY_LOCK_LIMIT |
| V04 | revisionHash equals the subject's head revision hash | MUTINY_LOCK_REVISION_STALE |
| V05 | peer classrup.bazaar.reservation/v1 has holder {type: cycle, id: subjectId}, signature verifies Ed25519 and the signer is the listing owner (F01.S03.M01 V11) and a giver in the head revision's legs, ext.revisionHash equals the head digest, and supersedesCid, when present, names an earlier active reservation of the same signer and subject | MUTINY_LOCK_STATEMENT_INVALID |
| V06 | peer reservation expiresAt ≥ head consentDeadline + executionWindowMs and is still in the future on the local clock | MUTINY_LOCK_STATEMENT_INVALID |
| V07 | conflict counts only peer and own reservations that are active, unexpired on the local clock and whose subject is non-terminal in this vault; another such reservation of the same item for a different subject that exceeds the quantity is a conflict | MUTINY_LOCK_CONFLICT |
| V08 | a release notice (classrup.mutiny.reservation_release/v1, alias of classrup.bazaar.reservation_release/v1, or classrup.bazaar.reservation_release/v1 itself with holder.type cycle) has exactly the payload {releasesCid, holder {type: cycle, id: subjectId}, reason} and releasesCid names an active reservation of the same signer and subject; it is accepted only from that signer and only while that reservation is active, and a notice naming any other cid is ignored | CONFLICT_STATE |
| V09 | issuedAtClaim is not more than 5 minutes after the local clock | MUTINY_LOCK_STATEMENT_INVALID |
| V10 | a local hold renewal never sets holdRenewedUntil past the statement's expiresAt or the hold's maxExpiresAt and never re-signs the statement | MUTINY_LOCK_EXPIRY_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-023-09.T01 | unit | PS-023-01.R01, PS-023-01.R03, PS-023-02.R01 | reserve I1 and I2 | InventoryPort lines mapped from the leg items, holds with holder {type: cycle, id: subjectId}, classrup.bazaar.reservation/v1 issued with ext.revisionHash, expiry equals deadline plus execution window |
| TEST-PS-023-09.T02 | unit | PS-023-02.R01, PS-023-02.R03 | each rule V01..V10 violated in turn | documented error code and no hold left behind |
| TEST-PS-023-09.T05 | integration | PS-023-02.R01, PS-023-06.R03 | reserve [I1, I2, I3] where I3 is unavailable | MUTINY_LOCK_UNAVAILABLE and I1, I2 holds absent |
| TEST-PS-023-09.T09 | integration | PS-023-02.R02, PS-023-07.R01 | peer statements: valid, bad signature, wrong signer, expiry too short, duplicated | only valid one stored; others quarantined; duplicate skipped |
| TEST-PS-023-09.T10 | integration | PS-023-07.R03, PS-023-02.R03 | peer double promise for one quantity-1 item in two subjects | both conflicted, conflict_detected emitted, both subjects frozen |
| TEST-PS-023-09.T20 | integration | PS-023-02.R03, PS-023-03.R01 | peer lock of a cycle that ended locally plus a new cycle over the same item; conflict_detected between two live subjects | ended subject's peer lock marked subject_ended and not counted, new cycle not frozen; for live subjects own locks of both are released with fork_frozen |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F07.S01.M01, F07.S02.M02, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
