# PS-085-04 — Commands, queries and events: Envelope signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M03 Envelope signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-085-04.R01** The module exposes functions, not network commands, and therefore has no capability-guarded commands or queries.
- **PS-085-04.R02** Function signatures return Result<T, AppError> per CTR-ERR-001 and never throw for bad input.
- **PS-085-04.R03** The module emits no events; callers record the outcome of verification in their own events.
- **PS-085-04.R04** This module is the single owner of the envelope and signature error codes; F11.S01.M02, F11.S02.*, and F11.S03.* reference them by listing F11.S01.M03 in depends_on and never redefine them (N1).

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
| FED_SIGNATURE_INVALID | 400 | no | signature missing, malformed, malleable or not valid for the verification key |
| FEDERATION_ENVELOPE_NOT_CANONICALIZABLE | 422 | no | envelope text has duplicate members, cannot be serialized under RFC 8785 or exceeds size or depth limits |
| FEDERATION_DID_UNSUPPORTED | 422 | no | did is not did:key with Ed25519 multicodec 0xed |
| FEDERATION_CID_MISMATCH | 422 | no | claimed cid differs from the cid computed over the envelope without sig and cid |
| FEDERATION_REQUEST_SIGNATURE_INVALID | 401 | no | RFC 9421 request signature, content-digest, created window, nonce replay or key resolution failed |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Library API surface (TypeScript): parseStrict(text) -> Result<unknown>; canonicalize(value) -> Uint8Array; cidOf(envelope) -> Cid (over envelope minus sig and cid); signEnvelope(draft, signingKey, signerKey?) -> Envelope (sets ext.signerKey when a device key signs, computes cid, then sig over envelope minus sig); verifyEnvelope(envelope) -> Result<{ cid, author, signerKey }>; didKeyEncode(pub32) -> string; didKeyDecode(did) -> Uint8Array(32); signRequest(req, key, keyid, nonce, now) -> { Signature-Input, Signature, Content-Digest }; verifyRequest(req, resolveKey, nonceStore, now) -> Result<{ keyid, kind: peer_relay|device }>.

### Example

```
const draft = { v: 1, type: "classrup.bazaar.listing/v1", author: "did:key:z6MkRoot...", createdAt: "2026-11-04T10:00:00.000Z", seq: 1, payload: { title: "Bike" }, ext: { stream: "pub" } };
const signed = signEnvelope(draft, deviceKey, "did:key:z6MkDev...");  // sets ext.signerKey, cid over draft minus sig/cid, then sig over envelope minus sig
verifyEnvelope(signed);                                                // Ok({ cid, author: "did:key:z6MkRoot...", signerKey: "did:key:z6MkDev..." })
verifyEnvelope({ ...signed, payload: { title: "Car" } });             // Err(FEDERATION_CID_MISMATCH)
verifyRequest(POST https://relay-b.example/fed/v1/inbox with Signature-Input sig1=("@method" "@target-uri" "content-digest");created=1793786400;keyid="relay:a.example#k1";nonce="0192f3a4-...";alg="ed25519", resolveKey, nonces, now) // Ok({ keyid, kind: "peer_relay" })
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-085-09.T06 | unit | PS-085-02.R03, PS-085-04.R02 | did:key with multicodec 0xe7 and with 31-byte key as author and as ext.signerKey; valid did round trip | FEDERATION_DID_UNSUPPORTED returned as a Result; valid did encodes and decodes identically |
| TEST-PS-085-09.T10 | unit | PS-085-01.R01, PS-085-03.R01, PS-085-03.R02, PS-085-03.R03, PS-085-04.R01, PS-085-04.R03, PS-085-05.R01, PS-085-05.R03 | call every function twice with identical input and inspect module for I/O and key-store access | identical outputs, no network or filesystem access, no event emitted, private keys only received as call arguments |
| TEST-PS-085-09.T20 | unit | PS-085-04.R04 | spec registry scan over all module.spec.yaml files | the five envelope and signature codes are defined only in F11.S01.M03 |

## Dependencies

Module depends on: CTR-FED-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
