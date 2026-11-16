# PS-130-09 — Contract and acceptance tests: Signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M03 Signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-130-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-130-09.R02** Ed25519 behavior is covered by RFC 8032 known-answer vectors including malleability cases, and domain separation by cross-context property tests.
- **PS-130-09.R03** Canonicalization is covered by the RFC 8785 test vectors.

## Specification

See the module test table below (all processes).

**Fixtures:** RFC 8032 vectors, RFC 8785 vectors, malleable-S and small-order vectors, registry snapshots for active, revoked, unknown and stale keys, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-130-09.T01 | unit | PS-130-01.R01, PS-130-01.R02, PS-130-01.R03, PS-130-02.R01 | sign consent payload and verify with expected context | envelope fields as specified; valid true; signed bytes equal context, 0x00, key digest, 0x00, JCS bytes |
| TEST-PS-130-09.T02 | unit | PS-130-02.R02, PS-130-09.R02 | RFC 8032 vectors; non-canonical S; small-order public key | vectors pass; malleable and small-order rejected with SECURITY_SIGNATURE_INVALID |
| TEST-PS-130-09.T03 | property | PS-130-01.R02, PS-130-05.R02 | random payloads signed under context A and verified under B | always SECURITY_CONTEXT_MISMATCH; no cross-context validity |
| TEST-PS-130-09.T04 | unit | PS-130-02.R01, PS-130-02.R03, PS-130-03.R02 | floats, duplicate keys, unsorted keys, lone surrogates, 65 KiB payload, RFC 8785 vectors | rejected with documented codes; canonical forms match vectors |
| TEST-PS-130-09.T05 | unit | PS-130-04.R01, PS-130-04.R02, PS-130-05.R01 | consent for revision 4 verified against expected revision 5 and another entity | bindingOk false; SECURITY_BINDING_MISMATCH |
| TEST-PS-130-09.T06 | integration | PS-130-03.R01, PS-130-03.R02, PS-130-03.R03 | registry snapshots active-fresh, revoked, stale 9 days, unknown, backdated signedAt | results valid-fresh, SECURITY_KEY_REVOKED, valid with freshness unknown, SECURITY_SIGNER_UNKNOWN, claim flagged |
| TEST-PS-130-09.T07 | abuse | PS-130-05.R03, PS-130-07.R01, PS-130-07.R03 | attempt to call signJcs from non-federation module; unknown context; raw key bytes passed | not exported; rejected; API refuses raw key bytes |
| TEST-PS-130-09.T08 | chaos | PS-130-06.R01, PS-130-06.R02, PS-130-06.R03, PS-130-03.R03 | registry lookup throws or times out | result valid cryptographically with keyStatus unknown and freshness unknown; never plain valid-fresh |
| TEST-PS-130-09.T09 | integration | PS-130-06.R01, PS-130-07.R02 | sign same payload twice; verify embedded envelopes in a stored consent | identical envelope bytes; library writes nothing |
| TEST-PS-130-09.T10 | unit | PS-130-07.R03, PS-130-04.R03 | honesty text present in signature detail panel; UI string audit | note present in all locales; no wording claims delivery or handover |
| TEST-PS-130-09.T11 | load | PS-130-08.R01, PS-130-08.R02, PS-130-08.R03 | 1 000 verifications per second for 5 minutes, 4 KiB payloads; Moto G profile | p95 ≤ 5 ms desktop and ≤ 25 ms Moto G; metrics exported |
| TEST-PS-130-09.T12 | unit | PS-130-09.R01, PS-130-09.R03 | traceability tool run | every PS-130 requirement maps to a passing test |
| TEST-PS-130-09.T13 | integration | PS-130-10.R01, PS-130-10.R02, PS-130-10.R03 | export consents with envelopes, import to fresh vault, version downgrade attempt | envelopes re-verify identically; unknown envelope version rejected |

## Acceptance criteria

- All tests T01–T13 pass in CI with RFC 8032 and RFC 8785 vectors.
- No signature validates under a context other than the one it was made for (property tests).
- Every verify result carries key status and revocation freshness, and the UI states what a signature does not prove.

## Dependencies

Module depends on: F16.S02.M02, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
