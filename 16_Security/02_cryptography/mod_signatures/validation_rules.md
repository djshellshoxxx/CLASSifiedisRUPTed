# PS-130-02 — Validation rules: Signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M03 Signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-130-02.R01** Envelopes are validated strictly for size, version, algorithm and context before any cryptographic operation.
- **PS-130-02.R02** Verification is strict Ed25519 (RFC 8032, canonical S, no small-order keys) and recomputes canonical bytes rather than trusting transmitted bytes.
- **PS-130-02.R03** Every violation maps to one stable error code, and results never reveal secret-dependent details.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | envelope version is 1, algorithm is ed25519 and payload is at most 65536 bytes | PAYLOAD_TOO_LARGE |
| V02 | context is in the registry and equals the caller's expected context | SECURITY_CONTEXT_MISMATCH |
| V03 | payload canonicalizes under RFC 8785 without duplicate keys, floats or lone surrogates and equals the transmitted form | SECURITY_PAYLOAD_NOT_CANONICAL |
| V04 | Ed25519 signature verifies strictly over the domain-separated bytes | SECURITY_SIGNATURE_INVALID |
| V05 | signer key is known to the registry and not revoked at the verifier's receipt time | SECURITY_SIGNER_UNKNOWN |
| V06 | for revision-bound contexts, payload entityType, entityId and revision equal the caller's expected values and contentHash matches | SECURITY_BINDING_MISMATCH |
| V07 | the signer key is not revoked for statements received after revocation | SECURITY_KEY_REVOKED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-130-09.T01 | unit | PS-130-01.R01, PS-130-01.R02, PS-130-01.R03, PS-130-02.R01 | sign consent payload and verify with expected context | envelope fields as specified; valid true; signed bytes equal context, 0x00, key digest, 0x00, JCS bytes |
| TEST-PS-130-09.T02 | unit | PS-130-02.R02, PS-130-09.R02 | RFC 8032 vectors; non-canonical S; small-order public key | vectors pass; malleable and small-order rejected with SECURITY_SIGNATURE_INVALID |
| TEST-PS-130-09.T04 | unit | PS-130-02.R01, PS-130-02.R03, PS-130-03.R02 | floats, duplicate keys, unsorted keys, lone surrogates, 65 KiB payload, RFC 8785 vectors | rejected with documented codes; canonical forms match vectors |

## Dependencies

Module depends on: F16.S02.M02, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
