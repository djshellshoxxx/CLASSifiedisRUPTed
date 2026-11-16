# PS-130-04 — Commands, queries and events: Signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M03 Signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-130-04.R01** sign returns a complete envelope and refuses unregistered contexts and payloads that fail their schema.
- **PS-130-04.R02** verify returns a structured result { valid, reason?, signerKeyId, context, bindingOk, keyStatus, freshnessClass, flags[] } and never throws on hostile input.
- **PS-130-04.R03** signJcs and verifyJcs exist only for the federation envelope (FED-2) and are not exported to other modules.

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
| SECURITY_SIGNATURE_INVALID | 422 | no | signature does not verify under strict Ed25519 |
| SECURITY_CONTEXT_MISMATCH | 422 | no | context unknown or different from the expected context |
| SECURITY_PAYLOAD_NOT_CANONICAL | 422 | no | payload is not in RFC 8785 canonical form or contains forbidden values |
| SECURITY_SIGNER_UNKNOWN | 422 | no | signer key is not known to the verifier's registry |
| SECURITY_BINDING_MISMATCH | 422 | no | signed entity, revision or content hash differs from what the caller expects |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Library module with no bus commands, queries or events. API is sign, verify, canonicalize, hashPayload and the context registry, usable in vault and relay, with no network access.

### Example

```
sign("classrup/consent/v1", { entityType: "cycle_proposal", entityId: "0192f430-…", revision: 4, contentHash: "9f86d081…", signedAt: "2026-11-04T10:00:00Z" }, keyHandle)
-> { v: 1, ctx: "classrup/consent/v1", kid: "Qm9b…", alg: "ed25519", payload: {…}, sig: "Zm9v…" }
verify(envelope, { expectedContext: "classrup/consent/v1", expected: { entityId: "0192f430-…", revision: 5 } }, status)
-> { valid: true, bindingOk: false, reason: "SECURITY_BINDING_MISMATCH" }   // signature was for revision 4
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-130-09.T05 | unit | PS-130-04.R01, PS-130-04.R02, PS-130-05.R01 | consent for revision 4 verified against expected revision 5 and another entity | bindingOk false; SECURITY_BINDING_MISMATCH |
| TEST-PS-130-09.T10 | unit | PS-130-07.R03, PS-130-04.R03 | honesty text present in signature detail panel; UI string audit | note present in all locales; no wording claims delivery or handover |

## Dependencies

Module depends on: F16.S02.M02, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
