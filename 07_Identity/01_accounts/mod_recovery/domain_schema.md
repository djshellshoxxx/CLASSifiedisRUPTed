# PS-053-01 — Domain schema: Account recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M03 Account recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-053-01.R01** A RecoveryKit record stores the KDF parameters, salt, nonce, encrypted account key blob, public verifier and lifecycle fields, and never the 24 words or the derived keys.
- **PS-053-01.R02** KDF parameters are fixed to scrypt N=131072, r=8, p=1 with a 16-byte salt and the cipher is XChaCha20-Poly1305 with a 24-byte nonce; weaker parameters are rejected.
- **PS-053-01.R03** Only one kit is active per account; creating a new one supersedes the old one.

## Specification

### RecoveryKit

Schema `classrup.identity.recovery_kit/v1` · storage **device** · privacy **P4** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| accountId | uuidv7 — ref Account |
| kdf | object — { name: scrypt, N: 131072, r: 8, p: 1, saltB64: 16 bytes base64url } |
| cipher | object — { name: xchacha20poly1305, nonceB64: 24 bytes base64url } |
| encryptedAccountKey | string — ciphertext plus 16-byte tag of the 32-byte account signing seed, base64url (64 characters) |
| verifierPublicKey | string — Ed25519 public key derived from the second 32 bytes of the KDF output, base64url (43 characters) |
| blobChecksum | string — SHA-256 of the kit file bytes, hex 64 characters |
| status | enum — active \| recovery_pending \| used \| superseded |
| createdAt | timestamp — local clock |
| lastVerifiedAt? | timestamp — local clock of the last successful verification |
| backupLabel? | string — 1..60 code points naming a user-chosen backup place, no path or secret |
| pendingDeviceKeyId? | uuidv7 — new device key registered by an in-progress recovery |
| requestedAt? | timestamp — local clock when recovery began |
| revokeOthersRequested? | boolean — whether other device keys are to be revoked |
| revokeOthersNotBefore? | timestamp — requestedAt plus 259 200 000 ms (72 h) |
| noticeStatementCid? | string — cid of the signed classrup.identity.recovery_notice/v1 |
| usedAt? | timestamp — local clock |
| revision | int — CTR-ID-001 ID-4 |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- kdf equals scrypt N=131072, r=8, p=1 with a 16-byte salt; any other parameter set is rejected.
- The 24 words, the derived encryption key and the derived verifier private key are never stored.
- At most one RecoveryKit per account has status active or recovery_pending.
- revokeOthersNotBefore equals requestedAt plus 72 hours when revokeOthersRequested is true.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-053-09.T01 | unit | PS-053-01.R01, PS-053-01.R02, PS-053-02.R01 | create kit with fixed salt and nonce | blob decrypts with the derived key; record stores no words or keys; kdf equals scrypt N=131072 r=8 p=1 |
| TEST-PS-053-09.T02 | unit | PS-053-01.R02, PS-053-02.R01 | create kit with N=16384 or a 12-byte nonce | IDENTITY_KIT_PARAMS_INVALID; nothing stored |
| TEST-PS-053-09.T04 | property | PS-053-01.R03, PS-053-03.R01, PS-053-03.R02, PS-053-03.R03 | random sequences of create, begin, complete, cancel, expire | only declared transitions succeed; one active or pending kit; used and superseded are final |
| TEST-PS-053-09.T13 | a11y | PS-053-01.R01, PS-053-03.R01 | create and recover screens with axe-core and keyboard only | zero serious or critical issues; paste of full phrase works |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
