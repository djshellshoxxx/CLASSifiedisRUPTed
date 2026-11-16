# PS-085-02 — Validation rules: Envelope signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M03 Envelope signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-085-02.R01** Every input is validated before cryptographic work to keep verification cost bounded and failure codes stable.
- **PS-085-02.R02** Envelope size is capped at 262144 bytes of canonical JSON and nesting depth at 32 to bound CPU use.
- **PS-085-02.R03** Each rule violation maps to one stable error code so callers can count and rate-limit by cause.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | envelope is a JSON object, canonical size ≤ 262144 bytes, nesting depth ≤ 32, contains no non-finite numbers or lone surrogates | FEDERATION_ENVELOPE_NOT_CANONICALIZABLE |
| V02 | sig is unpadded base64url decoding to exactly 64 bytes | FED_SIGNATURE_INVALID |
| V03 | author is did:key with multibase prefix z, multicodec bytes 0xed 0x01 and a 32-byte key | FEDERATION_DID_UNSUPPORTED |
| V04 | Ed25519 verification succeeds and S < group order L (RFC 8032 section 5.1.7) | FED_SIGNATURE_INVALID |
| V05 | cid claimed in the envelope equals sha256 of the JCS bytes without sig and cid | FEDERATION_CID_MISMATCH |
| V06 | relay request has Date within ±300 s, Digest header equals SHA-256 of the body and keyId resolves to a peer key | FEDERATION_REQUEST_SIGNATURE_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-085-09.T04 | unit | PS-085-01.R03, PS-085-02.R02, PS-085-02.R03 | sig of 63 and 65 bytes, padded base64, key of 31 bytes | FED_SIGNATURE_INVALID or FEDERATION_DID_UNSUPPORTED as listed |
| TEST-PS-085-09.T05 | unit | PS-085-02.R01, PS-085-02.R03 | envelope of 262145 bytes, depth 33, lone surrogate, 1e400 | FEDERATION_ENVELOPE_NOT_CANONICALIZABLE for each |
| TEST-PS-085-09.T06 | unit | PS-085-02.R03, PS-085-04.R02 | did:key with multicodec 0xe7 and with 31-byte key; valid did round trip | FEDERATION_DID_UNSUPPORTED; valid did encodes and decodes identically |
| TEST-PS-085-09.T07 | unit | PS-085-02.R03 | signature with S replaced by S plus L | rejected FED_SIGNATURE_INVALID (malleability) |
| TEST-PS-085-09.T08 | unit | PS-085-02.R03, PS-085-01.R01 | claimed cid altered by one character | FEDERATION_CID_MISMATCH |
| TEST-PS-085-09.T09 | unit | PS-085-02.R03, PS-085-06.R03 | request with Date 301 s old, wrong Digest, unknown keyId | FEDERATION_REQUEST_SIGNATURE_INVALID for each; 299 s old accepted |

## Dependencies

Module depends on: CTR-FED-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
