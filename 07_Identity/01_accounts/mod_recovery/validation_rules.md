# PS-053-02 — Validation rules: Account recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M03 Account recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-053-02.R01** Kit creation validates parameters and confirms the user saved the words; recovery validates words with a checksum before spending scrypt time.
- **PS-053-02.R02** Within one vault only one recovery may be pending and revocation of other devices before the window ends is refused; vaults cannot see each other, so these rules bind only the recovering vault, and receivers enforce their own 72 hour wait from first sight of the notice (F07.S02.M01).
- **PS-053-02.R03** Every failure maps to one stable error code without revealing which word was wrong.
- **PS-053-02.R04** Received recovery notices and disputes are verified against the DID root key and against the device keys of the latest identity document this vault holds, and are rate limited per DID and per signing key.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | kdf is scrypt with N=131072, r=8, p=1, salt 16 bytes, cipher xchacha20poly1305 with a 24-byte nonce | IDENTITY_KIT_PARAMS_INVALID |
| V02 | the user confirmed 3 randomly chosen words and the stored-separately acknowledgement before the kit is activated | VALIDATION_FAILED |
| V03 | entered words are 24 words of the 2048-word list and the 8-bit checksum matches | IDENTITY_KIT_WORDS_INVALID |
| V04 | the kit file checksum equals blobChecksum and decryption authenticates with the derived key | IDENTITY_KIT_CORRUPT |
| V05 | within this vault no other recovery is pending or contested and no kit replacement is attempted meanwhile; recoveries in other vaults are not visible here and receivers detect two notices for one DID as a fork | CONFLICT_STATE |
| V06 | the recovering vault requests revocation of other device keys only at or after revokeOthersNotBefore (72 h after begin, or 7 days after begin when contested) | IDENTITY_RECOVERY_WINDOW_OPEN |
| V07 | failed recovery attempts are fewer than 5 before the backoff of 60 s doubling to 900 s applies | RATE_LIMITED |
| V08 | revokeOthers needs a latest identity document verified by F07.S02.M01 from the begin input, the relays in the kit's docHint, or an export; without one begin fails unless the user chose device_list_unknown, which plans no revocation | DEPENDENCY_UNAVAILABLE |
| V09 | a received recovery notice verifies against the DID root key with prefix classrup-recovery-notice:v1; a received dispute verifies with prefix classrup-recovery-dispute:v1 against a device key active in the latest document this vault holds for the DID that is not the new key | IDENTITY_RECOVERY_STATEMENT_INVALID |
| V10 | at most one recovery notice per DID and one dispute per signing key are processed per 24 hours; extra ones are quarantined | RATE_LIMITED |
| V11 | registering the new device key keeps the account at no more than 10 active device keys (F07.S01.M01 registerRecoveredKey) | IDENTITY_DEVICE_LIMIT |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-053-09.T01 | unit | PS-053-01.R01, PS-053-01.R02, PS-053-02.R01, PS-053-09.R02 | create kit with fixed salt and nonce | blob decrypts with the derived key (known-answer vectors); record stores no words or keys; kdf equals scrypt N=131072 r=8 p=1; docHint embedded |
| TEST-PS-053-09.T02 | unit | PS-053-01.R02, PS-053-02.R01 | create kit with N=16384 or a 12-byte nonce | IDENTITY_KIT_PARAMS_INVALID; nothing stored |
| TEST-PS-053-09.T03 | unit | PS-053-02.R03 | words with wrong checksum, 23 words, unknown word, wrong file checksum, bit-flipped blob | IDENTITY_KIT_WORDS_INVALID or IDENTITY_KIT_CORRUPT without revealing which word |
| TEST-PS-053-09.T05 | integration | PS-053-03.R03, PS-053-02.R02 | honest client - begin with revokeOthers, complete at 71 h and at 72 h; peer P first saw the notice 10 h after begin | IDENTITY_RECOVERY_WINDOW_OPEN at 71 h; success at 72 h; P shows recovery pending and applies the revocation only at 82 h after begin |
| TEST-PS-053-09.T17 | integration | PS-053-09.R04, PS-053-02.R02, PS-053-05.R02 | two isolated vaults begin offline from the same kit with N1 and N2; a second begin inside one vault | both succeed locally; after sync receivers see two notices for one DID and freeze it as contested; the second begin in one vault returns CONFLICT_STATE |
| TEST-PS-053-09.T19 | abuse | PS-053-09.R04, PS-053-02.R04 | stolen D2 sends 5 disputes within 24 h | one processed, four quarantined with RATE_LIMITED; recovery contested and completed after 7 days with D2 revoked and contested visible to peers |
| TEST-PS-053-09.T20 | integration | PS-053-03.R04, PS-053-02.R04 | existing device D2 without a kit record receives the notice, disputes it; a second notice for the same DID within 24 h; a dispute signed by revoked key D3 | observed record received then disputed and dispute queued; second notice quarantined and the DID contested; D3 dispute IDENTITY_RECOVERY_STATEMENT_INVALID |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
