# PS-128-01 — Domain schema: Key lifecycle

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M01 Key lifecycle](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/key` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-128-01.R01** The stored wrapped key blob contains version, key role (root or device), KDF name and parameters (N, r, p), salt, nonce, ciphertext, key ID and algorithm, all authenticated as associated data.
- **PS-128-01.R02** Private keys exist unwrapped only in memory while unlocked, and the library exposes separate root and device key handles with sign and agree operations, never key bytes, to application code.
- **PS-128-01.R03** Key IDs are the SHA-256 thumbprint of the raw public key in base64url (used inside envelopes), the principal is the did:key encoding of the root Ed25519 public key, and every displayed fingerprint is F07.S01.M01 fingerprintOf (16 base58btc characters with the 8-word spoken form).
- **PS-128-01.R04** Each device's X25519 agreement key is derived deterministically from that device's Ed25519 key (RFC 7748 birational map of the public key, clamped SHA-512 scalar of the seed), so the root-signed portable identity document that lists the Ed25519 device key binds the agreement key, and no separate agreement key is generated, stored or published.

## Specification

**Note:** No catalog entities. The wrapped key blobs (classrup.security.wrappedkey/v1, one for the root key on the root device and one per local device key) and the local device-rotation progress records (classrup.security.devicerotation/v1 { oldKeyId, newKeyId, possessionSigDone, deviceLinkCid?, overlapEndsAt, revocationCid?, portableDocSeq? }) are vault storage of this client library and are not synced or shared.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-128-09.T01 | unit | PS-128-01.R03, PS-128-04.R01, PS-128-04.R04 | create a vault for a known seed and read the fingerprint | did:key from the root key and key IDs match independent vectors; fingerprint equals F07.S01.M01 fingerprintOf; no key bytes returned |
| TEST-PS-128-09.T03 | property | PS-128-01.R01 | random keys and passphrases wrapped and unwrapped; random bit flips in blob | round trip exact; any flip fails with SECURITY_UNLOCK_FAILED |
| TEST-PS-128-09.T16 | abuse | PS-128-01.R04, PS-128-02.R02 | relay-served mailbox hint with a substituted X25519 key for contact C; caller passes a raw agreement key to agree | the hint is ignored and the wrap targets the key derived from C's listed Ed25519 device key; SECURITY_AGREEMENT_KEY_UNBOUND |
| TEST-PS-128-09.T17 | unit | PS-128-01.R02, PS-128-04.R02 | root handle signs a listing draft; device handle signs a portable identity document and a device link; root handle signs a keyrevocation | SECURITY_KEY_ROLE_FORBIDDEN three times; the keyrevocation is signed |

## Dependencies

Module depends on: F16.S02.M02, F16.S02.M03, F15.S01.M01, F07.S01.M01, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
