# PS-130-04 — Commands, queries and events: Signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M03 Signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-130-04.R01** sign returns a complete envelope and refuses contexts outside the inventory, payloads that fail their schema and key handles whose role may not sign the context.
- **PS-130-04.R02** verify returns { accepted, reason?, signatureValid, contextOk, bindingOk, payloadHashOk, keyStatus, freshnessClass, flags[] }, where accepted is true only when signature, context, binding, payload hash and key status all pass, and it never throws on hostile input.
- **PS-130-04.R03** The module has no JCS, Ed25519 or did:key implementation and no request-signing scheme of its own; it calls F11.S01.M03, and device-to-relay HTTP requests use the F11.S01.M03 RFC 9421 profile with tag classrup/relay-request/v1, created, expires (at most created + 300 s), nonce and @target-uri.
- **PS-130-04.R04** Key status is an input and the module never calls the key registry, so F16.S02.M02 depends on this module without a cycle.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| SECURITY_SIGNATURE_INVALID | 422 | no | signature malformed, wrong algorithm, or not valid under strict Ed25519 |
| SECURITY_CONTEXT_MISMATCH | 422 | no | context outside the inventory, different from the expected context, or not signable by this key handle |
| SECURITY_PAYLOAD_NOT_CANONICAL | 422 | no | payload is not in RFC 8785 canonical form or contains forbidden values |
| SECURITY_SIGNER_UNKNOWN | 422 | no | the caller-supplied key status does not know the signer key |
| SECURITY_BINDING_MISMATCH | 422 | no | signed subject, revision, revision hash or statement key differs from what the caller expects |
| SECURITY_KEY_REVOKED | 422 | no | the caller-supplied key status reports the signer key revoked for this statement |
| SECURITY_PAYLOAD_HASH_MISMATCH | 422 | no | the payload's JCS hash differs from payloadHash, or a hash-only envelope was verified without its payload |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Library module with no bus commands, queries or events. API is sign(context, payload, keyHandle, { inline }), verify(envelope, { expectedContext, expectedBinding? }, keyStatus, payload?) -> { accepted, reason?, signatureValid, contextOk, bindingOk, payloadHashOk, keyStatus, freshnessClass, flags[] (clockClaim, finalStatement) }, payloadHashOf(payload), inventory() and findPrefixConflicts(entries), usable in vault and relay, with no network access. There is no signJcs, verifyJcs or request-signing entry point; those belong to F11.S01.M03.

### Example

```
sign("classrup/consent/v1", { subjectType: "mutiny_cycle", subjectRef: "0192f430-…", subjectRevision: 4, subjectRevisionHash: "sha256-n4bQ…", statementKey: "consent.mutiny.cycle.commit.v1", … }, deviceHandle, { inline: false })
-> { v: 1, ctx: "classrup/consent/v1", kid: "Qm9b…", alg: "ed25519", signedAt: "2026-11-04T10:00:00Z", payloadHash: "sha256-Hc4t…", sig: "Zm9v…" }   // sig over JCS of the six header members
verify(envelope, { expectedContext: "classrup/consent/v1", expectedBinding: { subjectRef: "0192f430-…", subjectRevision: 5, … } }, keyStatus, payload)
-> { accepted: false, reason: "SECURITY_BINDING_MISMATCH", signatureValid: true, bindingOk: false, payloadHashOk: true, keyStatus: "active", freshnessClass: "fresh" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-130-09.T01 | unit | PS-130-01.R01, PS-130-01.R02, PS-130-04.R01 | sign a consent payload inline and verify with expected context and binding | envelope fields as specified; accepted true; signed bytes equal JCS of the six header members and payloadHash equals the ID-3 cid of JCS(payload) |
| TEST-PS-130-09.T05 | unit | PS-130-04.R02 | consent for subjectRevision 4 verified against expected revision 5, another subjectRef and another statementKey | accepted false with SECURITY_BINDING_MISMATCH each time while signatureValid is true |
| TEST-PS-130-09.T07 | abuse | PS-130-04.R03, PS-130-05.R01 | import scan for signJcs, verifyJcs or a local Ed25519, JCS or did:key implementation; unknown context; raw key bytes passed to sign | none present, only F11.S01.M03 imported; rejected; refused |
| TEST-PS-130-09.T15 | unit | PS-130-04.R02, PS-130-01.R02 | hash-only envelope verified with the right payload, a different payload and no payload | accepted; SECURITY_PAYLOAD_HASH_MISMATCH; SECURITY_PAYLOAD_HASH_MISMATCH |
| TEST-PS-130-09.T16 | contract | PS-130-04.R03 | device-to-relay request signed with F11.S01.M03 signRequest and tag classrup/relay-request/v1; a request whose expires is 301 s after created; the same request body presented to verify as an envelope | the first verifies in F11.S01.M03; the second is refused there; verify returns SECURITY_SIGNATURE_INVALID |
| TEST-PS-130-09.T17 | contract | PS-130-09.R02, PS-130-04.R01 | F08.S02.M02 consent known-answer vectors in the header form | vectors pass in this suite and in the F08.S02.M02 suite |
| TEST-PS-130-09.T18 | unit | PS-130-04.R04 | import graph scan | the module imports no key registry or identity code |

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
