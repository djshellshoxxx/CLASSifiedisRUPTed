# PS-085-01 — Domain schema: Envelope signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M03 Envelope signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-085-01.R01** The library owns no stored entities; its value types are Envelope, Cid, DidKey and RequestSignature, all defined by CTR-FED-001.
- **PS-085-01.R02** The signed bytes are exactly the RFC 8785 JCS UTF-8 serialization of the envelope object with the sig member removed (the cid member stays, so the cid is signed), and the cid is "sha256-" + unpadded base64url of SHA-256 over the JCS bytes of the envelope with both sig and cid removed; this is the only normative definition and the golden vectors in tests/fixtures/federation/envelope-golden.json are shared with F11.S01.M02, F11.S01.M01 and F07.S02.M01.
- **PS-085-01.R03** Keys and signatures are fixed-size binary types with enforced lengths of 32 bytes (public key), 64 bytes (signature) and 32 bytes (SHA-256 digest).
- **PS-085-01.R04** The verification key of an envelope is ext.signerKey when present (a device did:key of the author principal) and otherwise the author did:key itself (a principal root key or a relay key); verifyEnvelope returns {cid, author, signerKey} and never decides delegation.

## Specification

**Note:** Pure functions and value types only; nothing is persisted by this module, so no entities are owned. Normative definitions: signedBytes(env) = JCS(env minus {sig}); cid(env) = "sha256-" + base64url(SHA-256(JCS(env minus {sig, cid}))); signing computes cid first, writes it into the envelope, then signs signedBytes. The relay request signature is RFC 9421 with Signature-Input sig1=("@method" "@target-uri" "content-digest");created=<unix>;keyid="<did:key or relay key id>";nonce="<batchId>";alg="ed25519" and Content-Digest per RFC 9530 (sha-256).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-085-09.T01 | contract | PS-085-01.R02, PS-085-09.R02 | run all RFC 8785 test vectors through canonicalize 5.1.0 | output bytes equal the expected vectors |
| TEST-PS-085-09.T02 | contract | PS-085-01.R03, PS-085-09.R02 | RFC 8032 section 7.1 vectors for sign and verify | signatures byte-equal, 32-byte keys and 64-byte signatures, verify Ok |
| TEST-PS-085-09.T04 | unit | PS-085-01.R03, PS-085-02.R03 | sig of 63 and 65 bytes, padded base64, key of 31 bytes | FED_SIGNATURE_INVALID or FEDERATION_DID_UNSUPPORTED as listed |
| TEST-PS-085-09.T08 | unit | PS-085-01.R02, PS-085-02.R03 | claimed cid altered by one character; cid recomputed by hand over the envelope minus sig and cid | FEDERATION_CID_MISMATCH; the hand-computed value equals cidOf; re-signing after a cid change yields a different sig (cid is signed) |
| TEST-PS-085-09.T10 | unit | PS-085-01.R01, PS-085-03.R01, PS-085-03.R02, PS-085-03.R03, PS-085-04.R01, PS-085-04.R03, PS-085-05.R01, PS-085-05.R03 | call every function twice with identical input and inspect module for I/O and key-store access | identical outputs, no network or filesystem access, no event emitted, private keys only received as call arguments |
| TEST-PS-085-09.T15 | contract | PS-085-01.R02, PS-085-09.R02 | shared golden envelopes (root-signed, device-signed, relay-signed) on Node and Chromium | cid and sig byte-equal to the fixture; the same fixture passes in the F11.S01.M02 and F07.S02.M01 suites |
| TEST-PS-085-09.T19 | unit | PS-085-01.R04 | envelope signed by a device key with ext.signerKey; envelope signed by the author root key without signerKey; signerKey set but signature made by the author key | first verifies against signerKey and returns it; second returns signerKey = author; third FED_SIGNATURE_INVALID |

## Dependencies

Module depends on: CTR-FED-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [module SPEC](SPEC.md).
