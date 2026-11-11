# F11.S01.M03 — Envelope signatures

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F11.S01](../SPEC.md). **Process IDs:** PS-085-01…PS-085-10. **Code:** `packages/federation/src/protocol/signatures`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Shared library, used in the browser vault, the PWA service worker and relays (ADR-0016), that parses envelopes strictly, canonicalizes them with RFC 8785 JCS (npm canonicalize 5.1.0, vendor-tested against the RFC 8785 test vectors), signs and verifies them with Ed25519 (RFC 8032), encodes and decodes did:key identifiers (multicodec ed25519-pub 0xed 0x01, base58btc with the z prefix) and signs and verifies HTTP requests with RFC 9421 HTTP Message Signatures. It holds the single normative definition of the envelope cid and signed bytes: the cid is computed over the envelope without sig and cid, and the signature covers the envelope without sig, so the cid itself is signed. The author of an envelope is the principal did:key; when ext.signerKey is present the signature is made by that device key, whose delegation F11.S01.M02 checks against the author's portable identity document. A valid signature is evidence that the holder of the key asserted the content; it proves nothing about delivery, truthfulness or the real-world identity of the signer.

## Responsibilities

- Produce the normative signed bytes and cid: cid = "sha256-" + base64url(SHA-256(JCS(envelope minus {sig, cid}))) and sig = Ed25519 over JCS(envelope minus {sig}), which includes cid; F11.S01.M02, F07 and CTR-ID-001 ID-3 reference this definition instead of restating it.
- Sign and verify Ed25519 signatures encoded as unpadded base64url (64 bytes decoded) with strict canonical-S checking.
- Encode a 32-byte Ed25519 public key to did:key:z6Mk... and decode it back, rejecting any other multicodec or length.
- Sign and verify relay and device requests as RFC 9421 HTTP Message Signatures (alg ed25519) covering @method, @target-uri (with the destination authority), content-digest (RFC 9530 sha-256), created, keyid and nonce = batchId, with a ±300 s created window and a 600 s (keyid, nonce) replay memory.
- Resolve the verification key of an envelope (ext.signerKey when present, otherwise the author key) and return {cid, author, signerKey}; whether that key is delegated by the author is decided by F11.S01.M02 V14 with the F07 portable document.
- Parse received envelope JSON text with a strict parser that rejects duplicate member names before any hashing.
- Own the envelope and signature error codes (FED_SIGNATURE_INVALID, FEDERATION_REQUEST_SIGNATURE_INVALID, FEDERATION_CID_MISMATCH, FEDERATION_ENVELOPE_NOT_CANONICALIZABLE, FEDERATION_DID_UNSUPPORTED); other F11 modules reference them through depends_on (N1).

## Not responsible for

- Storing envelopes or provenance (F11.S01.M02 mod_records).
- Holding user private keys; user device keys stay in the user's vault (non-extractable where the platform allows) and only an operator-held relay key is used on a relay.
- Deciding whether a valid signer holds the right role for a statement or whether a device key is delegated by the author (F11.S01.M01 registry and F11.S01.M02 enforcement with F07.S02.M01).
- Peer allowlists and key pinning decisions (F11.S03.M01 mod_trust); this library only calls the injected resolveKey callback.
- Future: ActivityPub HTTP Signatures (cavage draft) and AT Protocol repo signatures; only documented as mappings in F11.S03.M03.

## User stories

- As a relay operator, I can verify that an envelope received from a peer was signed by the did:key named in its author field or by a device key it names in ext.signerKey.
- As a developer, I can call one function to canonicalize, hash and sign an envelope on a device and get the same bytes and the same cid on every platform.
- As a security reviewer, I can run the vendored RFC 8785, RFC 8032 and RFC 9421 test vectors and the shared golden envelopes in CI and see them pass.

## Edge cases

- Envelope contains a number such as 1e400 or a lone surrogate in a string; canonicalization rejects it with FEDERATION_ENVELOPE_NOT_CANONICALIZABLE.
- Received JSON text repeats a member name (for example "seq" twice); the strict parser rejects it with FEDERATION_ENVELOPE_NOT_CANONICALIZABLE before any hash or signature work, so two platforms can never read different values from the same bytes.
- Signature is a valid Ed25519 signature but with non-canonical S (malleable); verification rejects it as FED_SIGNATURE_INVALID.
- author or ext.signerKey did:key uses a secp256k1 (0xe7) or P-256 multicodec; decode rejects it with FEDERATION_DID_UNSUPPORTED.
- Envelope with sig member plus an extra unknown top-level member; the unknown member is part of the signed bytes, so removing it invalidates the signature.
- The claimed cid is replaced by another cid while the rest is unchanged; the cid check fails with FEDERATION_CID_MISMATCH and, because the cid is inside the signed bytes, the signature also fails.
- Request created parameter is 301 s old, content-digest does not match the body, or the same (keyid, nonce) arrives again within 600 s; request verification rejects it with FEDERATION_REQUEST_SIGNATURE_INVALID.
- A request signed for relay A is replayed to relay B; @target-uri covers the destination authority, so verification at B fails.
- Same key signs the same envelope twice; Ed25519 is deterministic so both signatures are byte-identical and dedup is unaffected.

## UX and accessibility



Headless library; no screens. Errors surface to users in the statement detail view of the vault and to relay operators in the peer diagnostics screen of F11.S03.M01 using messageKey values federation.error.*.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

CTR-FED-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-085-01 | [Domain schema](domain_schema.md) | 4 |
| PS-085-02 | [Validation rules](validation_rules.md) | 5 |
| PS-085-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-085-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-085-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-085-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-085-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-085-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-085-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-085-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/federation/src/protocol/signatures/index.ts`.

## Acceptance criteria

- All tests T01–T20 pass in CI on Node 22 and Chromium.
- Every RFC 8785, RFC 8032 and RFC 9421 vector and every shared golden envelope passes.
- No private key bytes appear in any log, metric or error output (abuse tests T11 and T17).
