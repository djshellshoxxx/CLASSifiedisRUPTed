# PS-085-09 — Contract and acceptance tests: Envelope signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M03 Envelope signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-085-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-085-09.R02** Conformance is proven with public vectors (RFC 8785 appendix, RFC 8032 section 7.1, RFC 9421 appendix B ed25519 and RFC 9530) and the shared golden envelopes, run in CI on Node and Chromium.
- **PS-085-09.R03** Property tests prove sign-then-verify round trip and rejection of any single-bit mutation.

## Specification

See the module test table below (all processes).

**Fixtures:** Vendored vectors in tests/fixtures/federation/rfc8785.json, rfc8032.json, rfc9421.json and the shared golden envelopes envelope-golden.json (cid and sig for root-signed, device-signed and relay-signed envelopes, used by F11.S01.M01, F11.S01.M02 and F07.S02.M01); fixed test keypair seed 00..1f (32 bytes); fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-085-09.T01 | contract | PS-085-01.R02, PS-085-09.R02 | run all RFC 8785 test vectors through canonicalize 5.1.0 | output bytes equal the expected vectors |
| TEST-PS-085-09.T02 | contract | PS-085-01.R03, PS-085-09.R02 | RFC 8032 section 7.1 vectors for sign and verify | signatures byte-equal, 32-byte keys and 64-byte signatures, verify Ok |
| TEST-PS-085-09.T03 | property | PS-085-06.R01, PS-085-06.R02, PS-085-09.R03 | random envelopes: sign then verify; flip one random bit in payload, cid or sig; sign twice | round trip Ok; mutated input Err with one code; repeated signatures byte-identical |
| TEST-PS-085-09.T04 | unit | PS-085-01.R03, PS-085-02.R03 | sig of 63 and 65 bytes, padded base64, key of 31 bytes | FED_SIGNATURE_INVALID or FEDERATION_DID_UNSUPPORTED as listed |
| TEST-PS-085-09.T05 | unit | PS-085-02.R01, PS-085-02.R02 | envelope of 262145 bytes, depth 33, lone surrogate, 1e400 | FEDERATION_ENVELOPE_NOT_CANONICALIZABLE for each and a hash spy records no SHA-256 or Ed25519 call |
| TEST-PS-085-09.T06 | unit | PS-085-02.R03, PS-085-04.R02 | did:key with multicodec 0xe7 and with 31-byte key as author and as ext.signerKey; valid did round trip | FEDERATION_DID_UNSUPPORTED returned as a Result; valid did encodes and decodes identically |
| TEST-PS-085-09.T07 | unit | PS-085-02.R03 | signature with S replaced by S plus L | rejected FED_SIGNATURE_INVALID (malleability) |
| TEST-PS-085-09.T08 | unit | PS-085-01.R02, PS-085-02.R03 | claimed cid altered by one character; cid recomputed by hand over the envelope minus sig and cid | FEDERATION_CID_MISMATCH; the hand-computed value equals cidOf; re-signing after a cid change yields a different sig (cid is signed) |
| TEST-PS-085-09.T09 | unit | PS-085-02.R04, PS-085-06.R03 | RFC 9421 appendix B ed25519 vectors; request with created 301 s old; wrong Content-Digest; unknown keyid; same (keyid, nonce) twice within 600 s; request signed for relay A sent to relay B; device-key keyid resolved through the portable document stub | FEDERATION_REQUEST_SIGNATURE_INVALID for each failure; vectors and a 299 s old request verify; the replay is accepted again after 601 s |
| TEST-PS-085-09.T10 | unit | PS-085-01.R01, PS-085-03.R01, PS-085-03.R02, PS-085-03.R03, PS-085-04.R01, PS-085-04.R03, PS-085-05.R01, PS-085-05.R03 | call every function twice with identical input and inspect module for I/O and key-store access | identical outputs, no network or filesystem access, no event emitted, private keys only received as call arguments |
| TEST-PS-085-09.T11 | abuse | PS-085-07.R01, PS-085-07.R04 | induce every error with a seeded private key and capture logs, metrics and error JSON | key bytes never appear; did:key linkage warning present in docs build |
| TEST-PS-085-09.T12 | load | PS-085-07.R03, PS-085-08.R01, PS-085-08.R02, PS-085-08.R03 | verify 100-envelope batches of 4 KiB for 60 s | p95 per envelope ≤ 2 ms, batch ≤ 250 ms, metrics exported |
| TEST-PS-085-09.T13 | unit | PS-085-09.R01 | traceability tool run | every PS-085 requirement maps to a passing test |
| TEST-PS-085-09.T14 | unit | PS-085-10.R01, PS-085-10.R02, PS-085-10.R03 | verify golden envelopes created by the previous release; feed a v=2 envelope | all v=1 envelopes verify Ok after upgrade; v=2 is refused until a new version is defined; downgrade test passes |
| TEST-PS-085-09.T15 | contract | PS-085-01.R02, PS-085-09.R02 | shared golden envelopes (root-signed, device-signed, relay-signed) on Node and Chromium | cid and sig byte-equal to the fixture; the same fixture passes in the F11.S01.M02 and F07.S02.M01 suites |
| TEST-PS-085-09.T16 | unit | PS-085-02.R05, PS-085-02.R01 | raw text with member seq repeated with two values; same text through JSON.parse | parseStrict returns FEDERATION_ENVELOPE_NOT_CANONICALIZABLE before any hashing; verifyEnvelope accepts only parseStrict output |
| TEST-PS-085-09.T17 | abuse | PS-085-05.R02 | relay signing service loaded with the relay key; call every exported API, every error path and the diagnostics export | key bytes never appear in responses, logs, metrics or the diagnostics bundle; signing is reachable only through the signing service handle |
| TEST-PS-085-09.T18 | unit | PS-085-07.R02 | PWA bundle import scan and fetch/XHR/sendBeacon spies while running the full suite | no network or telemetry call from this library; counters exist only in the local diagnostics store |
| TEST-PS-085-09.T19 | unit | PS-085-01.R04 | envelope signed by a device key with ext.signerKey; envelope signed by the author root key without signerKey; signerKey set but signature made by the author key | first verifies against signerKey and returns it; second returns signerKey = author; third FED_SIGNATURE_INVALID |
| TEST-PS-085-09.T20 | unit | PS-085-04.R04 | spec registry scan over all module.spec.yaml files | the five envelope and signature codes are defined only in F11.S01.M03 |
| TEST-PS-085-09.T21 | unit | PS-085-02.R06 | envelope with ext.crit naming an unknown member; with an unknown non-critical member; ext of 4097 bytes; ext.crit naming an absent member; 17 crit names | first VALIDATION_FAILED; second parses and re-verifies with identical cid and signature bytes; the other three VALIDATION_FAILED before any hash call |
| TEST-PS-085-09.T22 | unit | PS-085-02.R07 | device-to-relay request with tag classrup/relay-request/v1 and expires = created + 300; expires = created + 301; missing tag; expired expires; relay-to-relay FED-10 request without tag | first verifies; next three FEDERATION_REQUEST_SIGNATURE_INVALID; the relay request verifies under the relay profile |
| TEST-PS-085-09.T23 | unit | PS-085-04.R05, PS-085-02.R03 | import scan of F16.S02.M03 and every signing module; small-order public key vector | they import jcs, ed25519 and did:key only from this module and contain no implementation of their own; the small-order key is rejected FED_SIGNATURE_INVALID |

## Acceptance criteria

- All tests T01–T23 pass in CI on Node 22 and Chromium.
- Every RFC 8785, RFC 8032 and RFC 9421 vector and every shared golden envelope passes.
- No private key bytes appear in any log, metric or error output (abuse tests T11 and T17).

## Dependencies

Module depends on: CTR-FED-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
