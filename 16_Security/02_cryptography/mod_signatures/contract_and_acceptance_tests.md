# PS-130-09 — Contract and acceptance tests: Signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M03 Signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-130-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-130-09.R02** Ed25519 behavior is covered by RFC 8032 known-answer vectors including malleability cases, and domain separation by cross-context property tests.
- **PS-130-09.R03** Canonicalization is covered by the RFC 8785 test vectors.

## Specification

See the module test table below (all processes).

**Fixtures:** RFC 8032 vectors, RFC 8785 vectors, malleable-S and small-order vectors, key status inputs for active-fresh, revoked, unknown and stale keys, F08.S02.M02 consent known-answer vectors in the header form, the repository's module.spec.yaml files for the inventory scan, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-130-09.T01 | unit | PS-130-01.R01, PS-130-01.R02, PS-130-04.R01 | sign a consent payload inline and verify with expected context and binding | envelope fields as specified; accepted true; signed bytes equal JCS of the six header members and payloadHash equals the ID-3 cid of JCS(payload) |
| TEST-PS-130-09.T02 | unit | PS-130-02.R02, PS-130-09.R02 | RFC 8032 vectors through F11.S01.M03; non-canonical S; small-order public key | vectors pass; malleable and small-order rejected with SECURITY_SIGNATURE_INVALID |
| TEST-PS-130-09.T03 | property | PS-130-01.R02, PS-130-07.R03 | random payloads signed under context A and verified under B; single mutations of v, kid, alg, signedAt or payloadHash | always accepted false with SECURITY_CONTEXT_MISMATCH; every header mutation fails the signature |
| TEST-PS-130-09.T04 | unit | PS-130-02.R01, PS-130-02.R03, PS-130-09.R03 | floats, duplicate keys, unsorted keys, lone surrogates, a 65 KiB payload, an envelope with v 2, alg es256, RFC 8785 vectors | SECURITY_PAYLOAD_NOT_CANONICAL, PAYLOAD_TOO_LARGE, UNSUPPORTED_SCHEMA_VERSION and SECURITY_SIGNATURE_INVALID, one code per violation; canonical forms match vectors |
| TEST-PS-130-09.T05 | unit | PS-130-04.R02 | consent for subjectRevision 4 verified against expected revision 5, another subjectRef and another statementKey | accepted false with SECURITY_BINDING_MISMATCH each time while signatureValid is true |
| TEST-PS-130-09.T06 | integration | PS-130-03.R01, PS-130-03.R02, PS-130-03.R03 | key status inputs active-fresh, revoked before first sight, active with freshness unknown after 9 days, unknown key; backdated signedAt | accepted; SECURITY_KEY_REVOKED; accepted with freshness unknown never upgraded; SECURITY_SIGNER_UNKNOWN; clock claim flagged without changing key status |
| TEST-PS-130-09.T07 | abuse | PS-130-04.R03, PS-130-05.R01 | import scan for signJcs, verifyJcs or a local Ed25519, JCS or did:key implementation; unknown context; raw key bytes passed to sign | none present, only F11.S01.M03 imported; rejected; refused |
| TEST-PS-130-09.T08 | chaos | PS-130-06.R01, PS-130-06.R02, PS-130-06.R03 | key status input missing, throwing or late; hostile envelope bytes | accepted false with keyStatus unknown, never accepted; no exception |
| TEST-PS-130-09.T09 | integration | PS-130-06.R01, PS-130-07.R02 | sign the same payload twice; verify embedded envelopes in a stored consent | identical envelope bytes; library writes nothing |
| TEST-PS-130-09.T10 | unit | PS-130-07.R01, PS-130-05.R03 | honesty text in the signature detail panel; UI string audit; inventory loaded from the frozen code table | note present in all locales; no wording claims delivery or handover; the inventory cannot be changed at runtime |
| TEST-PS-130-09.T11 | load | PS-130-08.R01, PS-130-08.R02, PS-130-08.R03 | 1 000 verifications per second for 5 minutes, 4 KiB payloads; Moto G profile | p95 ≤ 5 ms desktop and ≤ 25 ms Moto G; metrics exported and visible to the F16.S03.M02 hooks |
| TEST-PS-130-09.T12 | unit | PS-130-09.R01 | traceability tool run | every PS-130 requirement maps to a passing test |
| TEST-PS-130-09.T13 | integration | PS-130-10.R01, PS-130-10.R02, PS-130-10.R03, PS-130-05.R02 | export consents with envelopes, import to a fresh vault holding no secret, version downgrade attempt | envelopes re-verify identically from public keys and key status only; unknown envelope version kept opaque and flagged |
| TEST-PS-130-09.T14 | contract | PS-130-01.R03, PS-130-01.R04, PS-130-01.R05 | repository-wide scan of every signing prefix in module.spec.yaml files; prefix-ambiguity check over all entries; a proposed challenge entry without expiry and one that prefixes an existing entry | every prefix found is in the inventory with its owner and every entry is used; no entry prefixes another; both proposals refused |
| TEST-PS-130-09.T15 | unit | PS-130-04.R02, PS-130-01.R02 | hash-only envelope verified with the right payload, a different payload and no payload | accepted; SECURITY_PAYLOAD_HASH_MISMATCH; SECURITY_PAYLOAD_HASH_MISMATCH |
| TEST-PS-130-09.T16 | contract | PS-130-04.R03 | device-to-relay request signed with F11.S01.M03 signRequest and tag classrup/relay-request/v1; a request whose expires is 301 s after created; the same request body presented to verify as an envelope | the first verifies in F11.S01.M03; the second is refused there; verify returns SECURITY_SIGNATURE_INVALID |
| TEST-PS-130-09.T17 | contract | PS-130-09.R02, PS-130-04.R01 | F08.S02.M02 consent known-answer vectors in the header form | vectors pass in this suite and in the F08.S02.M02 suite |
| TEST-PS-130-09.T18 | unit | PS-130-04.R04 | import graph scan | the module imports no key registry or identity code |
| TEST-PS-130-09.T19 | unit | PS-130-02.R04, PS-130-03.R01 | statement c1 by key K1 verified with status revoked and finalListed true; statement c3 by K1 with status revoked and finalListed false; status active with finalListed true | accepted true with flag finalStatement; accepted false with SECURITY_KEY_REVOKED; accepted true without the flag |
| TEST-PS-130-09.T20 | contract | PS-130-01.R03 | inventory entry for classrup/receipt/v1 checked against F09.S02.M01 receipt fixtures, one with a 7.5 KiB keyLink chain | payload schema classrup.commerce.receipt/v1 statement, kid equal to signingKeyId, binding fields claimCid, dealId and contextCid, maximum 65536 bytes; the receipt with its keyLink verifies |

## Acceptance criteria

- All tests T01–T20 pass in CI with RFC 8032 and RFC 8785 vectors.
- No signature validates under a context other than the one it was made for (property tests), and the inventory has no prefix-ambiguous entries.
- Every verify result carries one accepted flag, key status and freshness, and the UI states what a signature does not prove.

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
