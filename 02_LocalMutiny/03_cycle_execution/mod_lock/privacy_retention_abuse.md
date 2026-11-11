# PS-023-07 — Privacy, retention and abuse: Cycle locks

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M02 Cycle locks](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/lock` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-023-07.R01** Reservation statements are P2, encrypted to the subject's parties, and reveal only item references already public in listings, the subject id and the expiry.
- **PS-023-07.R02** Error messages never reveal which other subject holds an item.
- **PS-023-07.R03** Item hoarding through reservations is limited by the cap of 5 active sets, absolute expiry and per-subject recipients' quarantine of repeat offenders.
- **PS-023-07.R04** The module registers ExportSectionPort (section mutiny.locks), DeletionPort and RetentionPurgePort with F10 (N6), annotates every CycleLock field with its F10.S02.M02 class, and on privacy.deletion.completed releases own holds and pseudonymizes retained records.

## Specification

**Data classification**
- CycleLock: P2; own holdId values are local-only and omitted from the signed statement; field classes annotated per F10.S02.M02.

**Retention**
- RET-EVIDENCE 2 years after the last related activity; local holds themselves are deleted when released or converted.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | A giver signs reservations for the same item in two cycles to promise it twice | local vault prevents it for the giver's own vault; peers that see both statements mark both conflicted and freeze; a malicious vault that never shows both cannot be detected, which the UI states as a limit |
| T02 | Hoarding items by proposing many cycles | cap of 5 active reservation sets, absolute statement expiry that local hold renewals never extend |
| T03 | Forged reservation of another person's item | signature must verify against the item owner's DID and the listing projection must be authored by that DID |
| T04 | Reservation expiry manipulated through the clock | expiry is evaluated on each vault's own clock and any disagreement with relay receipt time counts as expired |
| T05 | Release statement replayed to cancel a later reservation | the release notice carries releasesCid of the exact reservation it releases (V08) and a reserve carries supersedesCid; a notice naming another cid is ignored |
| T06 | Stale peer reservations freeze honest new cycles | V07 counts only active, unexpired locks of subjects that are non-terminal in this vault; peer locks are marked subject_ended when their subject ends locally |

**Abuse controls**
- Cap of 5 active own reservation sets and 20 reserve commands per day per vault.
- Recipients quarantine DIDs that send more than 10 reservation statements per hour.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-023-09.T09 | integration | PS-023-02.R02, PS-023-07.R01 | peer statements: valid, bad signature, wrong signer, expiry too short, duplicated | only valid one stored; others quarantined; duplicate skipped |
| TEST-PS-023-09.T10 | integration | PS-023-07.R03, PS-023-02.R03 | peer double promise for one quantity-1 item in two subjects | both conflicted, conflict_detected emitted, both subjects frozen |
| TEST-PS-023-09.T11 | abuse | PS-023-05.R01, PS-023-05.R02, PS-023-05.R03, PS-023-07.R03 | other principal reserves; reservation for another person's item; relay inspects mailbox | FORBIDDEN or quarantine; relay sees ciphertext only |
| TEST-PS-023-09.T12 | abuse | PS-023-07.R02, PS-023-07.R03 | 6th active set; replay of old release (releasesCid of the old reservation) against a newer reservation | MUTINY_LOCK_LIMIT; release ignored and the newer reservation stays active |
| TEST-PS-023-09.T22 | integration | PS-023-07.R04 | F10 export, deletion and retention sweep | section mutiny.locks exported without holdIds; erased principal's own holds released and records pseudonymized; signatures still verify |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F07.S01.M01, F07.S02.M02, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
