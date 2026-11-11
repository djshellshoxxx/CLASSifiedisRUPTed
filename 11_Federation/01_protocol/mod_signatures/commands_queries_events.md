# PS-085-04 — Commands, queries and events: Envelope signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M03 Envelope signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-085-04.R01** The module exposes functions, not network commands, and therefore has no capability-guarded commands or queries.
- **PS-085-04.R02** Function signatures return Result<T, AppError> per CTR-ERR-001 and never throw for bad input.
- **PS-085-04.R03** The module emits no events; callers record the outcome of verification in their own events.

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
| FED_SIGNATURE_INVALID | 400 | no | signature missing, malformed, malleable or not valid for the author key |
| FEDERATION_ENVELOPE_NOT_CANONICALIZABLE | 422 | no | envelope cannot be serialized under RFC 8785 or exceeds size or depth limits |
| FEDERATION_DID_UNSUPPORTED | 422 | no | did is not did:key with Ed25519 multicodec 0xed |
| FEDERATION_CID_MISMATCH | 422 | no | claimed cid differs from the computed cid |
| FEDERATION_REQUEST_SIGNATURE_INVALID | 401 | no | relay request signature, digest or date check failed |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Library API surface (TypeScript): canonicalize(value) -> Uint8Array; cidOf(envelope) -> Cid; signEnvelope(envelope, privateKey) -> Envelope; verifyEnvelope(envelope) -> Result<VerifiedEnvelope>; didKeyEncode(pub32) -> string; didKeyDecode(did) -> Uint8Array(32); signRequest(req, relayKey) -> headers; verifyRequest(req, resolveKey, now) -> Result<PeerKeyId>.

### Example

```
const env = { v: 1, type: "classrup.bazaar.listing/v1", author: "did:key:z6Mk...", createdAt: "2026-11-04T10:00:00.000Z", seq: 1, payload: { title: "Bike" }, ext: {} };
const signed = signEnvelope(env, devicePrivateKey);   // adds cid and sig
verifyEnvelope(signed);                                 // Ok({ cid, author })
verifyEnvelope({ ...signed, payload: { title: "Car" } }); // Err(FED_SIGNATURE_INVALID)
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-085-09.T06 | unit | PS-085-02.R03, PS-085-04.R02 | did:key with multicodec 0xe7 and with 31-byte key; valid did round trip | FEDERATION_DID_UNSUPPORTED; valid did encodes and decodes identically |
| TEST-PS-085-09.T10 | unit | PS-085-03.R01, PS-085-03.R02, PS-085-03.R03, PS-085-04.R01, PS-085-04.R03, PS-085-05.R01, PS-085-05.R02, PS-085-05.R03, PS-085-06.R01 | call every function twice with identical input and inspect module for I/O | identical outputs, no network or filesystem access, Result returned, no event emitted |

## Dependencies

Module depends on: CTR-FED-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
