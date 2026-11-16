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
| V03 | AEAD authentication succeeds with associated data (version, kdf params, key ID) | SECURITY_UNLOCK_FAILED |
| V04 | rotation statement is signed by both the old and the new key over the same payload | SECURITY_ROTATION_INVALID |
| V05 | the browser provides crypto.getRandomValues and IndexedDB; otherwise vault creation is refused | SECURITY_ENVIRONMENT_UNSUPPORTED |
| V06 | imported backup file has matching version and decrypts with the supplied passphrase | SECURITY_UNLOCK_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-128-09.T01 | unit | PS-128-01.R01, PS-128-01.R03, PS-128-02.R01, PS-128-04.R01 | create vault and derive principal and thumbprint for a known seed | did:key and key ID match independent vectors |
| TEST-PS-128-09.T04 | unit | PS-128-02.R02, PS-128-02.R03 | blob with N=1024; wrong version; missing salt | SECURITY_WRAPPED_KEY_INVALID before any derivation |
| TEST-PS-128-09.T05 | unit | PS-128-02.R01 | passphrases of 11 code points, a common entry, and a 12-code-point unique phrase | first two rejected with SECURITY_PASSPHRASE_WEAK; third accepted |

## Dependencies

Module depends on: CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
