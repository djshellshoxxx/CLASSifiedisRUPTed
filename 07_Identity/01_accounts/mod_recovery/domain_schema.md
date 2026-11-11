# PS-053-01 — Domain schema: Account recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M03 Account recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-053-01.R01** A RecoveryKit record of role kit stores the KDF parameters, salt, nonce, encrypted account root key blob, public verifier, the identity document hint and lifecycle fields, and never the 24 words or the derived keys; a record of role observed holds a recovery notice for the own DID that an existing device received.
- **PS-053-01.R02** KDF parameters are fixed to scrypt N=131072, r=8, p=1 with a 16-byte salt and the cipher is XChaCha20-Poly1305 with a 24-byte nonce; weaker parameters are rejected.
- **PS-053-01.R03** Only one kit is active per account in a vault and creating a new one supersedes the old one locally, but every kit wraps the same root key, so a superseded kit is not revoked and the UI and acceptance criteria say so.

## Specification

### RecoveryKit

Schema `classrup.identity.recovery_kit/v1` · storage **device** · privacy **P4** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| accountId | uuidv7 — ref Account |
| role | enum — kit \| observed |
| kdf? | object — kit only; { name: scrypt, N: 131072, r: 8, p: 1, saltB64: 16 bytes base64url } |
| cipher? | object — kit only; { name: xchacha20poly1305, nonceB64: 24 bytes base64url } |
| encryptedAccountKey? | string — kit only; ciphertext plus 16-byte tag of the 32-byte account root seed, base64url (64 characters) |
| verifierPublicKey? | string — kit only; Ed25519 public key derived from the second 32 bytes of the KDF output, base64url (43 characters) |
| blobChecksum? | string — kit only; SHA-256 of the kit file bytes, hex 64 characters |
| docHint? | object — kit only; { did, seq, cid, relays } of the identity document current at kit creation, also copied into the kit file |
| status | enum — kit: active \| recovery_pending \| contested \| used \| superseded; observed: received \| disputed \| accepted \| expired |
| createdAt | timestamp — local clock |
| lastVerifiedAt? | timestamp — local clock of the last successful verification |
| backupLabel? | string — 1..60 code points naming a user-chosen backup place, no path or secret |
| mode? | enum — full \| device_list_unknown (begin without a verified latest document; can add a key, revokes nothing) |
| latestDocCid? | string — cid of the latest identity document verified by F07.S02.M01 at begin |
| pendingDeviceKeyId? | uuidv7 — new device key registered by an in-progress recovery |
| requestedAt? | timestamp — local clock when recovery began |
| revokeOthersRequested? | boolean — whether other device keys are to be revoked |
| plannedRevocations? | array — public keys to revoke on complete, taken from the verified latest document |
| revokeOthersNotBefore? | timestamp — requestedAt plus 259 200 000 ms (72 h); requestedAt plus 7 days once contested |
| noticeStatementCid? | string — cid of the root-signed classrup.identity.recovery_notice/v1 |
| disputeCids? | array — at most 8 cids of verified classrup.identity.recovery_dispute/v1 statements |
| contestedAt? | timestamp — local clock of the first verified dispute |
| observed? | object — observed only; { noticeCid, newDevicePublicKey, notBeforeClaim, firstSeenAt (local clock), disputeCid?, decidedAt? } |
| usedAt? | timestamp — local clock |
| revision | int — CTR-ID-001 ID-4 |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- For role kit, kdf equals scrypt N=131072, r=8, p=1 with a 16-byte salt; any other parameter set is rejected.
- The 24 words, the derived encryption key, the decrypted root seed and the derived verifier private key are never stored.
- At most one role-kit record per account in a vault has status active, recovery_pending or contested.
- revokeOthersNotBefore equals requestedAt plus 72 hours when revokeOthersRequested is true, and requestedAt plus 7 days once the record is contested.
- Role observed records hold no blob, KDF parameters or verifier, and plannedRevocations is empty when mode is device_list_unknown.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-053-09.T01 | unit | PS-053-01.R01, PS-053-01.R02, PS-053-02.R01, PS-053-09.R02 | create kit with fixed salt and nonce | blob decrypts with the derived key (known-answer vectors); record stores no words or keys; kdf equals scrypt N=131072 r=8 p=1; docHint embedded |
| TEST-PS-053-09.T02 | unit | PS-053-01.R02, PS-053-02.R01 | create kit with N=16384 or a 12-byte nonce | IDENTITY_KIT_PARAMS_INVALID; nothing stored |
| TEST-PS-053-09.T04 | property | PS-053-01.R03, PS-053-03.R01, PS-053-03.R02 | random sequences of create, begin, complete, cancel, dispute and expiry | only declared transitions succeed; one active, pending or contested kit per vault; used and superseded are final |
| TEST-PS-053-09.T23 | unit | PS-053-01.R03, PS-053-07.R03 | create kit 2 after kit 1, then decrypt kit 1 | kit 1 superseded locally but still decrypts the root seed; the UI copy states that superseding does not revoke the old kit |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
