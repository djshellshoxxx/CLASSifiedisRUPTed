# PS-130-02 — Validation rules: Signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M03 Signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-130-02.R01** Envelopes are validated strictly for size, version, algorithm and context before any cryptographic operation.
- **PS-130-02.R02** Verification is strict Ed25519 (RFC 8032, canonical S, no small-order keys) through F11.S01.M03 and recomputes the header bytes and payloadHash rather than trusting transmitted bytes.
- **PS-130-02.R03** Every violation maps to one stable error code, and results never reveal secret-dependent details.
- **PS-130-02.R04** A revoked signer key passes the key-status check only for a statement that the caller-supplied status marks finalListed (listed in the finalCids of the key's account_deleted revocation, F16.S02.M02), and the result then carries flag finalStatement.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | the payload, inline or supplied by the caller, is at most 65536 bytes of canonical JSON (or the context's smaller maximum) | PAYLOAD_TOO_LARGE |
| V02 | ctx is in the inventory and equals the caller's expected context | SECURITY_CONTEXT_MISMATCH |
| V03 | payload canonicalizes under RFC 8785 through F11.S01.M03 without duplicate keys, floats or lone surrogates and equals the transmitted form | SECURITY_PAYLOAD_NOT_CANONICAL |
| V04 | the Ed25519 signature verifies strictly over JCS({ v, ctx, kid, alg, signedAt, payloadHash }) with the public key of kid | SECURITY_SIGNATURE_INVALID |
| V05 | the signer key is known - the caller-supplied key status for kid is not unknown | SECURITY_SIGNER_UNKNOWN |
| V06 | for revision-bound contexts, payload subjectType, subjectRef, subjectRevision, subjectRevisionHash and statementKey equal the caller's expected values | SECURITY_BINDING_MISMATCH |
| V07 | the caller-supplied key status (F07.S02.M01 KeyStatusPort at the statement's first-seen time for user keys; F16.S02.M02 for relay-owned and peer relay keys) is not revoked, unless F16.S02.M02 get_status marks this statement finalListed (its cid is in the finalCids of the key's account_deleted revocation), which passes with flag finalStatement | SECURITY_KEY_REVOKED |
| V08 | envelope v equals 1 | UNSUPPORTED_SCHEMA_VERSION |
| V09 | alg is ed25519 and sig decodes to exactly 64 bytes | SECURITY_SIGNATURE_INVALID |
| V10 | SHA-256 over the JCS bytes of the payload (inline, or supplied by the caller for a hash-only envelope) equals payloadHash; a hash-only envelope verified without a payload is not accepted | SECURITY_PAYLOAD_HASH_MISMATCH |
| V11 | sign - the context is in the inventory, the key handle's role may sign it (F16.S02.M01) and the payload passes the context's schema | SECURITY_CONTEXT_MISMATCH |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-130-09.T02 | unit | PS-130-02.R02, PS-130-09.R02 | RFC 8032 vectors through F11.S01.M03; non-canonical S; small-order public key | vectors pass; malleable and small-order rejected with SECURITY_SIGNATURE_INVALID |
| TEST-PS-130-09.T04 | unit | PS-130-02.R01, PS-130-02.R03, PS-130-09.R03 | floats, duplicate keys, unsorted keys, lone surrogates, a 65 KiB payload, an envelope with v 2, alg es256, RFC 8785 vectors | SECURITY_PAYLOAD_NOT_CANONICAL, PAYLOAD_TOO_LARGE, UNSUPPORTED_SCHEMA_VERSION and SECURITY_SIGNATURE_INVALID, one code per violation; canonical forms match vectors |
| TEST-PS-130-09.T19 | unit | PS-130-02.R04, PS-130-03.R01 | statement c1 by key K1 verified with status revoked and finalListed true; statement c3 by K1 with status revoked and finalListed false; status active with finalListed true | accepted true with flag finalStatement; accepted false with SECURITY_KEY_REVOKED; accepted true without the flag |

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
