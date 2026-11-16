# PS-130-01 — Domain schema: Signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M03 Signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-130-01.R01** The envelope contains version, context, signer key ID, algorithm ed25519, signedAt claim, payload (canonical JSON) or payload hash, and the base64url 64-byte signature.
- **PS-130-01.R02** The signed bytes are UTF-8 of the context, one zero byte, the 32-byte signer key ID digest, one zero byte, then the JCS bytes of the payload, so context and key are bound into every signature.
- **PS-130-01.R03** Contexts follow classrup/<purpose>/v<major> and the registry maps each context to a payload schema ID, a maximum size and whether a revision binding is required.

## Specification

**Note:** No catalog entities. The signature envelope is a wire and storage format embedded in other modules' records, versioned as classrup.security.envelope/v1, and the context registry is a static table in code.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-130-09.T01 | unit | PS-130-01.R01, PS-130-01.R02, PS-130-01.R03, PS-130-02.R01 | sign consent payload and verify with expected context | envelope fields as specified; valid true; signed bytes equal context, 0x00, key digest, 0x00, JCS bytes |
| TEST-PS-130-09.T03 | property | PS-130-01.R02, PS-130-05.R02 | random payloads signed under context A and verified under B | always SECURITY_CONTEXT_MISMATCH; no cross-context validity |

## Dependencies

Module depends on: F16.S02.M02, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
