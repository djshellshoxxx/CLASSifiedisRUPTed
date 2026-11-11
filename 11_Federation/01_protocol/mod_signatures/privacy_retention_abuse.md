# PS-085-07 — Privacy, retention and abuse: Envelope signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M03 Envelope signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-085-07.R01** Private key material is never logged, serialized into errors or included in metrics labels.
- **PS-085-07.R02** The library emits no telemetry from the PWA (OBS-7); counters are kept locally for diagnostics and exported only by the user.
- **PS-085-07.R03** Verification cost is bounded so that malformed envelopes cannot be used to exhaust relay CPU.
- **PS-085-07.R04** did:key values are pseudonymous identifiers, not anonymous; this module documents that a did:key links all records of one author.

## Specification

**Data classification**
- Public keys and signatures: P0 (published in envelopes).
- Private keys: P4, never enter this library's outputs; relay key kept in the secrets store of F16.S02.
- NonceStore entries (keyid, nonce, seenAt): RET-EPHEMERAL, 600 s.

**Retention**
- No data is retained by the library; logs hold only cid prefix (first 12 chars) and error code under RET-AUDIT; nonce memory expires after 600 s.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Signature malleability producing a second valid signature for the same content | strict canonical-S check on verify (V04) |
| T02 | CPU exhaustion with huge or deeply nested JSON | size 262144 bytes and depth 32 limits before hashing or verifying (V01) |
| T03 | Replay of a captured relay request, or replay to another relay | RFC 9421 created within ±300 s, nonce = batchId remembered per keyid for 600 s, @target-uri binds the destination authority; receivers also dedup by cid (F11.S02.M02) |
| T04 | Canonicalization or duplicate-member differences between platforms causing forged-looking or rejected valid records | single vendored canonicalize 5.1.0 tested against RFC 8785 vectors, strict parser rejecting duplicate members, shared golden envelopes on Node and browser CI |
| T05 | Downgrade to a weaker key type via did:key multicodec swap | only 0xed 0x01 accepted for author and signerKey (V03, V07) |
| T06 | cid substitution: attacker swaps the cid to collide dedup with another record | cid recomputed over the envelope minus sig and cid (V05) and the cid is inside the signed bytes |
| T07 | Critical-extension downgrade: an old reader acting on an envelope whose meaning depends on an extension it ignores, or ext used to smuggle large data | V08 refuses unknown members named in ext.crit, keeps others byte-exact and caps ext at 4096 bytes |

**Abuse controls**
- Callers count FED_SIGNATURE_INVALID, FEDERATION_CID_MISMATCH and FEDERATION_REQUEST_SIGNATURE_INVALID per sending peer and feed them to the F11.S03.M01 health score; a peer with 20 invalid signatures in 10 minutes is suspended there.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-085-09.T11 | abuse | PS-085-07.R01, PS-085-07.R04 | induce every error with a seeded private key and capture logs, metrics and error JSON | key bytes never appear; did:key linkage warning present in docs build |
| TEST-PS-085-09.T12 | load | PS-085-07.R03, PS-085-08.R01, PS-085-08.R02, PS-085-08.R03 | verify 100-envelope batches of 4 KiB for 60 s | p95 per envelope ≤ 2 ms, batch ≤ 250 ms, metrics exported |
| TEST-PS-085-09.T18 | unit | PS-085-07.R02 | PWA bundle import scan and fetch/XHR/sendBeacon spies while running the full suite | no network or telemetry call from this library; counters exist only in the local diagnostics store |

## Dependencies

Module depends on: CTR-FED-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
