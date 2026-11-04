# PS-085-09 — Contract and acceptance tests: Envelope signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M03 Envelope signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-085-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-085-09.R02** Conformance is proven with public vectors (RFC 8785 appendix and RFC 8032 section 7.1) run in CI on Node and Chromium.
- **PS-085-09.R03** Property tests prove sign-then-verify round trip and rejection of any single-bit mutation.

## Specification

See the module test table below (all processes).

**Fixtures:** Vendored vectors in tests/fixtures/federation/rfc8785.json and rfc8032.json; fixed test keypair seed 00..1f (32 bytes); fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-085-09.T01 | contract | PS-085-01.R01, PS-085-09.R02 | run all RFC 8785 test vectors through canonicalize 5.1.0 | output bytes equal the expected vectors |
| TEST-PS-085-09.T02 | contract | PS-085-01.R02, PS-085-09.R02 | RFC 8032 section 7.1 vectors for sign and verify | signatures byte-equal and verify Ok |
| TEST-PS-085-09.T03 | property | PS-085-01.R02, PS-085-06.R02, PS-085-09.R03 | random envelopes: sign then verify; flip one random bit in payload or sig | round trip Ok; mutated input Err FED_SIGNATURE_INVALID |
| TEST-PS-085-09.T04 | unit | PS-085-01.R03, PS-085-02.R02, PS-085-02.R03 | sig of 63 and 65 bytes, padded base64, key of 31 bytes | FED_SIGNATURE_INVALID or FEDERATION_DID_UNSUPPORTED as listed |
| TEST-PS-085-09.T05 | unit | PS-085-02.R01, PS-085-02.R03 | envelope of 262145 bytes, depth 33, lone surrogate, 1e400 | FEDERATION_ENVELOPE_NOT_CANONICALIZABLE for each |
| TEST-PS-085-09.T06 | unit | PS-085-02.R03, PS-085-04.R02 | did:key with multicodec 0xe7 and with 31-byte key; valid did round trip | FEDERATION_DID_UNSUPPORTED; valid did encodes and decodes identically |
| TEST-PS-085-09.T07 | unit | PS-085-02.R03 | signature with S replaced by S plus L | rejected FED_SIGNATURE_INVALID (malleability) |
| TEST-PS-085-09.T08 | unit | PS-085-02.R03, PS-085-01.R01 | claimed cid altered by one character | FEDERATION_CID_MISMATCH |
| TEST-PS-085-09.T09 | unit | PS-085-02.R03, PS-085-06.R03 | request with Date 301 s old, wrong Digest, unknown keyId | FEDERATION_REQUEST_SIGNATURE_INVALID for each; 299 s old accepted |
| TEST-PS-085-09.T10 | unit | PS-085-03.R01, PS-085-03.R02, PS-085-03.R03, PS-085-04.R01, PS-085-04.R03, PS-085-05.R01, PS-085-05.R02, PS-085-05.R03, PS-085-06.R01 | call every function twice with identical input and inspect module for I/O | identical outputs, no network or filesystem access, Result returned, no event emitted |
| TEST-PS-085-09.T11 | abuse | PS-085-07.R01, PS-085-07.R03, PS-085-07.R04 | induce errors with a seeded private key and capture logs, metrics and error JSON | key bytes never appear; did:key linkage warning present in docs build |
| TEST-PS-085-09.T12 | load | PS-085-07.R02, PS-085-08.R01, PS-085-08.R02, PS-085-08.R03 | verify 100-envelope batches of 4 KiB for 60 s | p95 per envelope ≤ 2 ms, batch ≤ 250 ms, metrics exported |
| TEST-PS-085-09.T13 | unit | PS-085-09.R01 | traceability tool run | every PS-085 requirement maps to a passing test |
| TEST-PS-085-09.T14 | unit | PS-085-10.R01, PS-085-10.R02, PS-085-10.R03 | verify golden envelopes created by the previous release | all verify Ok after upgrade; downgrade test passes |

## Acceptance criteria

- All tests T01–T14 pass in CI on Node 22 and Chromium.
- Every RFC 8785 and RFC 8032 vector in the vendored fixtures passes.
- No private key bytes appear in any log, metric or error output (abuse test).

## Dependencies

Module depends on: CTR-FED-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
