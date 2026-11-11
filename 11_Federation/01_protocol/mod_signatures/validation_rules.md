# PS-085-02 — Validation rules: Envelope signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M03 Envelope signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-085-02.R01** Every input is validated before cryptographic work to keep verification cost bounded and failure codes stable.
- **PS-085-02.R02** Envelope size is capped at 262144 bytes of canonical JSON and nesting depth at 32 to bound CPU use.
- **PS-085-02.R03** Each rule violation maps to one stable error code so callers can count and rate-limit by cause.
- **PS-085-02.R04** Request signatures follow RFC 9421 with the covered components @method, @target-uri (including the destination authority), content-digest (RFC 9530) and the parameters created, keyid and nonce (batchId for inbox batches); verification checks the created window of ±300 s, the digest, the ed25519 signature over the signature base and that (keyid, nonce) was not seen in the last 600 s; resolveKey covers peer relay keys (F11.S03.M01) and device keys (F07.S02.M01 portable document).
- **PS-085-02.R05** Received envelope text is parsed by a strict parser that rejects duplicate member names, so every implementation canonicalizes exactly the same object.
- **PS-085-02.R06** The ext member of a received envelope is preserved byte-exact, is at most 4096 bytes of canonical JSON, and every member named in ext.crit must be understood by the reader (the injected understood-extension set from the F11.S01.M01 registered ext members), otherwise the envelope is refused with VALIDATION_FAILED.
- **PS-085-02.R07** Device-to-relay requests use the profile tag="classrup/relay-request/v1" and must carry the parameters created, expires (at most created + 300 s), keyid, nonce and tag over @method, @target-uri and content-digest; relay-to-relay requests use the FED-10 profile and, when they carry expires, it is also at most created + 300 s.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | envelope text parses strictly (no duplicate member names) into a JSON object, canonical size ≤ 262144 bytes, nesting depth ≤ 32, no non-finite numbers or lone surrogates | FEDERATION_ENVELOPE_NOT_CANONICALIZABLE |
| V02 | sig is unpadded base64url decoding to exactly 64 bytes | FED_SIGNATURE_INVALID |
| V03 | author is did:key with multibase prefix z, multicodec bytes 0xed 0x01 and a 32-byte key | FEDERATION_DID_UNSUPPORTED |
| V04 | Ed25519 verification with the verification key (ext.signerKey or author) over JCS(envelope minus sig) succeeds, S < group order L (RFC 8032 section 5.1.7) and the public key is not a small-order point | FED_SIGNATURE_INVALID |
| V05 | claimed cid equals "sha256-" + base64url(SHA-256(JCS(envelope minus sig and cid))) | FEDERATION_CID_MISMATCH |
| V06 | RFC 9421 request signature: Signature-Input covers @method, @target-uri and content-digest with the parameters created, keyid and nonce and alg ed25519; device-to-relay requests also carry tag classrup/relay-request/v1 and expires, and any expires is after created and at most created + 300 s and not passed; created within ±300 s of now; Content-Digest equals sha-256 of the body; keyid resolves through resolveKey to a peer relay key or a registered device key; (keyid, nonce) not seen in the last 600 s (a repeat is reported with params.reason = replay and is answered only from the caller's Idempotency-Key store); the signature over the signature base verifies | FEDERATION_REQUEST_SIGNATURE_INVALID |
| V07 | ext.signerKey, when present, is a did:key with multicodec 0xed 0x01 and a 32-byte key | FEDERATION_DID_UNSUPPORTED |
| V08 | ext is a JSON object of at most 4096 canonical bytes; ext.crit, when present, is an array of 1..16 distinct member names each present in ext, and every name in it is in the reader's understood-extension set; unknown members not named in ext.crit are preserved byte-exact | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-085-09.T04 | unit | PS-085-01.R03, PS-085-02.R03 | sig of 63 and 65 bytes, padded base64, key of 31 bytes | FED_SIGNATURE_INVALID or FEDERATION_DID_UNSUPPORTED as listed |
| TEST-PS-085-09.T05 | unit | PS-085-02.R01, PS-085-02.R02 | envelope of 262145 bytes, depth 33, lone surrogate, 1e400 | FEDERATION_ENVELOPE_NOT_CANONICALIZABLE for each and a hash spy records no SHA-256 or Ed25519 call |
| TEST-PS-085-09.T06 | unit | PS-085-02.R03, PS-085-04.R02 | did:key with multicodec 0xe7 and with 31-byte key as author and as ext.signerKey; valid did round trip | FEDERATION_DID_UNSUPPORTED returned as a Result; valid did encodes and decodes identically |
| TEST-PS-085-09.T07 | unit | PS-085-02.R03 | signature with S replaced by S plus L | rejected FED_SIGNATURE_INVALID (malleability) |
| TEST-PS-085-09.T08 | unit | PS-085-01.R02, PS-085-02.R03 | claimed cid altered by one character; cid recomputed by hand over the envelope minus sig and cid | FEDERATION_CID_MISMATCH; the hand-computed value equals cidOf; re-signing after a cid change yields a different sig (cid is signed) |
| TEST-PS-085-09.T09 | unit | PS-085-02.R04, PS-085-06.R03 | RFC 9421 appendix B ed25519 vectors; request with created 301 s old; wrong Content-Digest; unknown keyid; same (keyid, nonce) twice within 600 s; request signed for relay A sent to relay B; device-key keyid resolved through the portable document stub | FEDERATION_REQUEST_SIGNATURE_INVALID for each failure; vectors and a 299 s old request verify; the replay is accepted again after 601 s |
| TEST-PS-085-09.T16 | unit | PS-085-02.R05, PS-085-02.R01 | raw text with member seq repeated with two values; same text through JSON.parse | parseStrict returns FEDERATION_ENVELOPE_NOT_CANONICALIZABLE before any hashing; verifyEnvelope accepts only parseStrict output |
| TEST-PS-085-09.T21 | unit | PS-085-02.R06 | envelope with ext.crit naming an unknown member; with an unknown non-critical member; ext of 4097 bytes; ext.crit naming an absent member; 17 crit names | first VALIDATION_FAILED; second parses and re-verifies with identical cid and signature bytes; the other three VALIDATION_FAILED before any hash call |
| TEST-PS-085-09.T22 | unit | PS-085-02.R07 | device-to-relay request with tag classrup/relay-request/v1 and expires = created + 300; expires = created + 301; missing tag; expired expires; relay-to-relay FED-10 request without tag | first verifies; next three FEDERATION_REQUEST_SIGNATURE_INVALID; the relay request verifies under the relay profile |
| TEST-PS-085-09.T23 | unit | PS-085-04.R05, PS-085-02.R03 | import scan of F16.S02.M03 and every signing module; small-order public key vector | they import jcs, ed25519 and did:key only from this module and contain no implementation of their own; the small-order key is rejected FED_SIGNATURE_INVALID |

## Dependencies

Module depends on: CTR-FED-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
