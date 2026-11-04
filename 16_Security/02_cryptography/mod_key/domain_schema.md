# PS-128-01 — Domain schema: Key lifecycle

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M01 Key lifecycle](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/key` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-128-01.R01** The stored wrapped key blob contains version, KDF name and parameters (N, r, p), salt, nonce, ciphertext, key ID and algorithm, all authenticated as associated data.
- **PS-128-01.R02** Private keys exist unwrapped only in memory while unlocked, and the library exposes sign and agree operations without exposing key bytes to application code.
- **PS-128-01.R03** Key IDs are the SHA-256 thumbprint of the raw public key in base64url, and the principal is the did:key encoding of the Ed25519 public key.

## Specification

**Note:** No catalog entities. The wrapped key blob and rotation records are local vault storage of the client library, versioned as classrup.security.wrappedkey/v1 and are not synced or shared.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-128-09.T01 | unit | PS-128-01.R01, PS-128-01.R03, PS-128-02.R01, PS-128-04.R01 | create vault and derive principal and thumbprint for a known seed | did:key and key ID match independent vectors |
| TEST-PS-128-09.T02 | unit | PS-128-01.R01, PS-128-01.R02, PS-128-09.R02 | known-answer tests for Ed25519, x25519, scrypt and XChaCha20-Poly1305 | all standard vectors pass |
| TEST-PS-128-09.T03 | property | PS-128-01.R02, PS-128-06.R01 | random keys and passphrases wrapped and unwrapped; random bit flips in blob | round trip exact; any flip fails with SECURITY_UNLOCK_FAILED |

## Dependencies

Module depends on: CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
