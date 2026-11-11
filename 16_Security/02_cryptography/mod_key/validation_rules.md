# PS-128-02 — Validation rules: Key lifecycle

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M01 Key lifecycle](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/key` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-128-02.R01** Passphrases are validated for minimum length and a bundled common-passphrase list before any key is created or wrapped.
- **PS-128-02.R02** KDF parameters read from a stored blob are validated against allowed minimums before use, so a tampered blob cannot lower the cost.
- **PS-128-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | passphrase is at least 12 Unicode code points after NFKC normalization and not in the common list | SECURITY_PASSPHRASE_WEAK |
| V02 | blob KDF is scrypt with N ≥ 131072, r ≥ 8, p ≥ 1 and salt of 16 bytes | SECURITY_WRAPPED_KEY_INVALID |
| V03 | AEAD authentication succeeds with associated data (version, key role, kdf params, key ID) | SECURITY_UNLOCK_FAILED |
| V04 | device rotation - the new key's possession signature over classrup-device-link:v1:<did>:<newPublicKey>:<linkNonce> verifies, the device link is signed by the root handle through F07.S01.M01, and the overlap is 0 to 7 days | SECURITY_ROTATION_INVALID |
| V05 | the browser provides crypto.getRandomValues and IndexedDB; otherwise vault creation is refused | SECURITY_ENVIRONMENT_UNSUPPORTED |
| V06 | imported backup file has matching version and decrypts with the supplied passphrase | SECURITY_UNLOCK_FAILED |
| V07 | the root handle signs only classrup.identity.portable_doc/v1, classrup.identity.device_link/v1, classrup.security.keyrevocation/v1 and classrup.identity.recovery_notice/v1, and a device handle never signs portable_doc, device_link or recovery_notice | SECURITY_KEY_ROLE_FORBIDDEN |
| V08 | agree uses only an agreement key derived here from an Ed25519 device key that the peer's root-signed portable identity document lists as active; a raw agreement key from a relay, hint or statement is refused | SECURITY_AGREEMENT_KEY_UNBOUND |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-128-09.T04 | unit | PS-128-02.R02, PS-128-02.R03, PS-128-09.R03 | blob with N=1024; wrong version; missing salt | SECURITY_WRAPPED_KEY_INVALID before any derivation |
| TEST-PS-128-09.T05 | unit | PS-128-02.R01, PS-128-07.R03 | passphrases of 11 code points, a common entry, and a 12-code-point unique phrase; the create-vault screen text | first two rejected with SECURITY_PASSPHRASE_WEAK; third accepted; the screen states that a weak passphrase can still be guessed offline |
| TEST-PS-128-09.T08 | unit | PS-128-02.R03, PS-128-03.R02 | rotation with a missing possession signature; device link not signed by the root handle; overlap of 10 days; old key marked compromised | SECURITY_ROTATION_INVALID three times; immediate revocation with overlap 0 and reason compromised |
| TEST-PS-128-09.T16 | abuse | PS-128-01.R04, PS-128-02.R02 | relay-served mailbox hint with a substituted X25519 key for contact C; caller passes a raw agreement key to agree | the hint is ignored and the wrap targets the key derived from C's listed Ed25519 device key; SECURITY_AGREEMENT_KEY_UNBOUND |

## Dependencies

Module depends on: F16.S02.M02, F16.S02.M03, F15.S01.M01, F07.S01.M01, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
