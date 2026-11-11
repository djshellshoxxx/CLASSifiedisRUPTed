# PS-090-02 — Validation rules: Account and relay migration

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M03 Account and relay migration](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/migration` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-090-02.R01** A move is valid only when signed by a device key that the subject's latest verified portable document lists as active at the receiver's time of evaluation, and when all timing, key-age and cool-down rules hold.
- **PS-090-02.R02** Observed moves from others are verified exactly like own moves and ignored otherwise.
- **PS-090-02.R03** Every violation maps to one stable error code with a localized message key.
- **PS-090-02.R04** The veto window is measured on each receiver's own clock from its first verified receipt (or the old relay's signed receipt time), never from the claimed announcedAt, so a backdated move is still held for a full 24 h and can be vetoed.
- **PS-090-02.R05** A relay move signed by a key other than the pinned relay key is dropped and counted only against the sender that signed the delivering request, never against the relay it names.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | move statement signature verifies (F11.S01.M03) and the signer is a device key listed active in the subject's latest verified portable document at the receiver's time (F07.S02.M01 key_status); the check is repeated at promotion to effective and a key revoked by then invalidates the move regardless of announcedAt | FEDERATION_MOVE_SIGNER_INVALID |
| V02 | last effective move of the subject is ≥ 30 days old | FEDERATION_MOVE_COOLDOWN |
| V03 | toRelay is an active selected relay or peer with confirmed fingerprint (F11.S03.M01) and differs from fromRelay | FEDERATION_MOVE_TARGET_INVALID |
| V04 | a receiver that gets the move straight from the signing device (the principal's other devices, or a relay inbox from a hosted device key) requires abs(announcedAt - now) ≤ 10 min; no receiver accepts an announcedAt more than 10 min in its future; the window starts at this receiver's first verified receipt, or at the old relay's signed receipt time when one is attached, never at announcedAt | VALIDATION_FAILED |
| V05 | relay move statement is signed by the pinned relay key and the new base URL passes F11.S03.M01 V01; a wrong-key relay move is dropped and counted only against the delivering sender when that sender signed the request | FEDERATION_KEY_MISMATCH |
| V06 | veto statement (move_cancel) is signed by a device key of the subject other than the move signer and received before this receiver's effectiveAt | FEDERATION_MOVE_VETO_INVALID |
| V07 | copy step completed for ≥ 99 percent of public records, with every failure listed, before announce | PRECONDITION_FAILED |
| V08 | own announce: the signing key has been active in the principal's portable document for ≥ 24 h; receivers: effectiveAt is postponed to 24 h after this verifier first saw the signer key in a verified portable-document version (not its addedAt claim) | FEDERATION_MOVE_SIGNER_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-090-09.T02 | unit | PS-090-02.R03 | each rule V01–V08 violated | documented code; no state change |
| TEST-PS-090-09.T03 | abuse | PS-090-02.R01, PS-090-07.R02 | own announce signed by a revoked key, by an unlisted key and by a key added 1 h earlier | FEDERATION_MOVE_SIGNER_INVALID for each |
| TEST-PS-090-09.T12 | abuse | PS-090-07.R02, PS-090-02.R01 | second move after 10 days; 4th move statement in 90 days | FEDERATION_MOVE_COOLDOWN; rate limit |
| TEST-PS-090-09.T14 | integration | PS-090-02.R05, PS-090-04.R03 | relay move signed by the pinned key; relay move signed by a different key delivered by sender relay S with S's request signature | base URL updated on peers for the first; second dropped with FEDERATION_KEY_MISMATCH, counted against S only, and the named relay is not suspended |
| TEST-PS-090-09.T21 | integration | PS-090-02.R02 | observer V3 receives a move signed by a key not listed in P's portable document | ignored: no announced record, no account.moved, no redirect or fetch-hint change; FEDERATION_MOVE_SIGNER_INVALID recorded locally |
| TEST-PS-090-09.T22 | abuse | PS-090-02.R04 | observer V3 receives a move whose announcedAt claims 25 h ago with no old relay receipt; R1 receives the same move straight from a hosted device | V3 holds it for a full 24 h from its first receipt and a K2 veto at 23 h cancels it; R1 refuses it with VALIDATION_FAILED |
| TEST-PS-090-09.T25 | integration | PS-090-02.R01 | K1 revoked in a newer portable document after the move was announced but before V3's effectiveAt | the promotion re-check cancels the move; no account.moved emitted |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S02.M03, F11.S03.M01, F07.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
