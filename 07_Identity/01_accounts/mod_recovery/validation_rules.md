# PS-053-02 — Validation rules: Account recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M03 Account recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-053-02.R01** Kit creation validates parameters and confirms the user saved the words; recovery validates words with a checksum before spending scrypt time.
- **PS-053-02.R02** Only one recovery may be pending; revocation of other devices before the notice window ends is refused.
- **PS-053-02.R03** Every failure maps to one stable error code without revealing which word was wrong.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | kdf is scrypt with N=131072, r=8, p=1, salt 16 bytes, cipher xchacha20poly1305 with a 24-byte nonce | IDENTITY_KIT_PARAMS_INVALID |
| V02 | the user confirmed 3 randomly chosen words and the stored-separately acknowledgement before the kit is activated | VALIDATION_FAILED |
| V03 | entered words are 24 words of the 2048-word list and the 8-bit checksum matches | IDENTITY_KIT_WORDS_INVALID |
| V04 | the kit file checksum equals blobChecksum and decryption authenticates with the derived key | IDENTITY_KIT_CORRUPT |
| V05 | no other recovery is pending and no kit replacement is attempted while pending | CONFLICT_STATE |
| V06 | revoking other device keys is requested only at or after revokeOthersNotBefore | IDENTITY_RECOVERY_WINDOW_OPEN |
| V07 | failed recovery attempts are fewer than 5 before the backoff of 60 s doubling to 900 s applies | RATE_LIMITED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-053-09.T01 | unit | PS-053-01.R01, PS-053-01.R02, PS-053-02.R01 | create kit with fixed salt and nonce | blob decrypts with the derived key; record stores no words or keys; kdf equals scrypt N=131072 r=8 p=1 |
| TEST-PS-053-09.T02 | unit | PS-053-01.R02, PS-053-02.R01 | create kit with N=16384 or a 12-byte nonce | IDENTITY_KIT_PARAMS_INVALID; nothing stored |
| TEST-PS-053-09.T03 | unit | PS-053-02.R02, PS-053-02.R03 | words with wrong checksum, 23 words, unknown word, wrong file checksum, bit-flipped blob | IDENTITY_KIT_WORDS_INVALID or IDENTITY_KIT_CORRUPT without revealing which word |
| TEST-PS-053-09.T05 | integration | PS-053-03.R03, PS-053-02.R03 | begin with revokeOthers then complete at 71 h and at 72 h | IDENTITY_RECOVERY_WINDOW_OPEN at 71 h; success at 72 h with D1 and D2 revoked and statements queued |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
