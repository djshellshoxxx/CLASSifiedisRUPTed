# PS-090-02 — Validation rules: Account and relay migration

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M03 Account and relay migration](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/migration` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-090-02.R01** A move is valid only when signed by a registered device key of the subject and when all timing and cool-down rules hold.
- **PS-090-02.R02** Observed moves from others are verified exactly like own moves and ignored otherwise.
- **PS-090-02.R03** Every violation maps to one stable error code with a localized message key.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | move statement signature verifies and signer is a device key listed in the subject's portable document valid at announcedAt (F07.S02.M01) | FEDERATION_MOVE_SIGNER_INVALID |
| V02 | last effective move of the subject is ≥ 30 days old | FEDERATION_MOVE_COOLDOWN |
| V03 | toRelay is an active selected relay or peer with confirmed fingerprint (F11.S03.M01) and differs from fromRelay | FEDERATION_MOVE_TARGET_INVALID |
| V04 | effectiveAt is announcedAt + 24 h (±0) and announcedAt is not more than 7 days in the future of the receiver clock | VALIDATION_FAILED |
| V05 | relay move statement is signed by the pinned relay key and the new base URL passes F11.S03.M01 V01 | FEDERATION_KEY_MISMATCH |
| V06 | veto statement is signed by a registered device key other than the signer, received before effectiveAt | FEDERATION_MOVE_VETO_INVALID |
| V07 | copy step completed for ≥ 99 percent of public records, with every failure listed, before announce | PRECONDITION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-090-09.T02 | unit | PS-090-02.R01, PS-090-02.R03 | each rule V01–V07 violated | documented code; no state change |
| TEST-PS-090-09.T03 | abuse | PS-090-02.R01, PS-090-07.R02 | move signed by revoked key, unlisted key and key registered 1 h earlier | FEDERATION_MOVE_SIGNER_INVALID |
| TEST-PS-090-09.T04 | integration | PS-090-03.R01, PS-090-03.R02, PS-090-02.R02 | veto from K2 at 23 h 59 min and at 24 h 01 min | first cancels the move; second ignored; redirect inactive after cancel |
| TEST-PS-090-09.T12 | abuse | PS-090-07.R02, PS-090-02.R02 | second move after 10 days; 4th move statement in 90 days | FEDERATION_MOVE_COOLDOWN; rate limit |

## Dependencies

Module depends on: F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S03.M01, F07.S02.M01, F10.S01.M04, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
