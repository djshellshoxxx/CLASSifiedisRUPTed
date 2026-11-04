# PS-128-10 — Import, export, backup and rollback: Key lifecycle

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M01 Key lifecycle](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/key` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-128-10.R01** The encrypted backup file contains the wrapped blob and public metadata only, uses the same KDF and cipher, and is the user's primary key backup alongside the recovery kit under the user's control.
- **PS-128-10.R02** Import decrypts with the passphrase, validates parameters and refuses unknown or downgraded versions.
- **PS-128-10.R03** Blob format changes follow versioned parsers, keep v1 readable for 180 days and re-wrap to the newest version only after a successful unlock.

## Specification

- **export:** Download classrup-key-backup.json containing the v1 wrapped blob (scrypt parameters, salt, nonce, ciphertext, key ID) and the public principal; the passphrase is never included; recovery kit handling stays in F07.S01.M03.
- **import:** Importing a backup on a new device creates a vault with the same key after passphrase verification; if a vault already exists the user must choose to replace it, and the old blob is kept until the new one unlocks successfully.
- **backup:** Vault export (IOX-6) includes the wrapped blob; keys are never uploaded by default; users are warned after 30 days without an export.
- **migration rollback:** Raising scrypt cost or switching ciphers adds a new blob version; unlock re-wraps after success and keeps the old blob for 7 days to allow rollback; older clients refuse unknown versions rather than guess.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-128-09.T15 | integration | PS-128-10.R01, PS-128-10.R02, PS-128-10.R03 | export backup, import on a fresh browser profile, downgrade attempt | same principal and fingerprint; wrong passphrase fails generically; older client rejects unknown version |

## Dependencies

Module depends on: CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
