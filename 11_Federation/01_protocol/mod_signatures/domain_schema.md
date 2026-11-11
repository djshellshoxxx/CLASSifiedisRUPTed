# PS-085-01 — Domain schema: Envelope signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M03 Envelope signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-085-01.R01** The library owns no stored entities; its value types are Envelope, Cid, DidKey and RequestSignature, all defined by CTR-FED-001.
- **PS-085-01.R02** The signed bytes are exactly the RFC 8785 JCS UTF-8 serialization of the envelope object with the sig member removed, with no other transformation.
- **PS-085-01.R03** Keys and signatures are fixed-size binary types with enforced lengths of 32 bytes (public key), 64 bytes (signature) and 32 bytes (SHA-256 digest).

## Specification

**Note:** Pure functions and value types only; nothing is persisted by this module, so no entities are owned.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-085-09.T01 | contract | PS-085-01.R01, PS-085-09.R02 | run all RFC 8785 test vectors through canonicalize 5.1.0 | output bytes equal the expected vectors |
| TEST-PS-085-09.T02 | contract | PS-085-01.R02, PS-085-09.R02 | RFC 8032 section 7.1 vectors for sign and verify | signatures byte-equal and verify Ok |
| TEST-PS-085-09.T03 | property | PS-085-01.R02, PS-085-06.R02, PS-085-09.R03 | random envelopes: sign then verify; flip one random bit in payload or sig | round trip Ok; mutated input Err FED_SIGNATURE_INVALID |
| TEST-PS-085-09.T04 | unit | PS-085-01.R03, PS-085-02.R02, PS-085-02.R03 | sig of 63 and 65 bytes, padded base64, key of 31 bytes | FED_SIGNATURE_INVALID or FEDERATION_DID_UNSUPPORTED as listed |
| TEST-PS-085-09.T08 | unit | PS-085-02.R03, PS-085-01.R01 | claimed cid altered by one character | FEDERATION_CID_MISMATCH |

## Dependencies

Module depends on: CTR-FED-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [module SPEC](SPEC.md).
