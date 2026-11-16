# F11.S01.M03 — Envelope signatures

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F11.S01](../SPEC.md). **Process IDs:** PS-085-01…PS-085-10. **Code:** `packages/federation/src/protocol/signatures`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Shared library, used in the browser vault, the PWA service worker and relays (ADR-0016), that canonicalizes federation envelopes with RFC 8785 JCS (npm canonicalize 5.1.0, vendor-tested against the RFC 8785 test vectors), signs and verifies them with Ed25519 (RFC 8032), encodes and decodes did:key identifiers (multicodec ed25519-pub 0xed 0x01, base58btc with the z prefix) and signs relay-to-relay HTTP requests. A valid signature is evidence that the holder of the key asserted the content; it proves nothing about delivery, truthfulness or the real-world identity of the signer.

## Responsibilities

- Produce JCS bytes of an envelope without its sig member and compute the cid as "sha256-" plus base64url of SHA-256 over those bytes.
- Sign and verify Ed25519 signatures encoded as unpadded base64url (64 bytes decoded) with strict canonical-S checking.
- Encode a 32-byte Ed25519 public key to did:key:z6Mk... and decode it back, rejecting any other multicodec or length.
- Sign and verify relay request headers (Date, Digest, Signature) for POST /fed/v1/inbox with a 300 s clock window.

## Not responsible for

- Storing envelopes or provenance (F11.S01.M02 mod_records).
- Holding user private keys; user device keys stay in the user's vault (non-extractable where the platform allows) and only an operator-held relay key is used on a relay.
- Deciding whether a valid signer holds the right role for a statement (F11.S01.M01 registry and F11.S01.M02 enforcement).
- Peer allowlists and key pinning decisions (F11.S03.M01 mod_trust).
- Future: ActivityPub HTTP Signatures and AT Protocol repo signatures; only documented as mappings in F11.S03.M03.

## User stories

- As a relay operator, I can verify that an envelope received from a peer was signed by the did:key named in its author field.
- As a developer, I can call one function to canonicalize, hash and sign an envelope on a device and get the same bytes on every platform.
- As a security reviewer, I can run the vendored RFC 8785 test vectors and the RFC 8032 vectors in CI and see them pass.

## Edge cases

- Envelope contains a number such as 1e400, a lone surrogate in a string or a duplicate key after parsing; canonicalization rejects it with FEDERATION_ENVELOPE_NOT_CANONICALIZABLE.
- Signature is a valid Ed25519 signature but with non-canonical S (malleable); verification rejects it as FED_SIGNATURE_INVALID.
- author did:key uses a secp256k1 (0xe7) or P-256 multicodec; decode rejects it with FEDERATION_DID_UNSUPPORTED.
- Envelope with sig member plus an extra unknown top-level member; the unknown member is part of the signed bytes, so removing it invalidates the signature.
- Relay request Date header is 301 s old or Digest does not match the body; request verification rejects it.
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
| PS-085-01 | [Domain schema](domain_schema.md) | 3 |
| PS-085-02 | [Validation rules](validation_rules.md) | 3 |
| PS-085-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-085-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-085-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-085-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-085-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-085-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-085-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-085-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/federation/src/protocol/signatures/index.ts`.

## Acceptance criteria

- All tests T01–T14 pass in CI on Node 22 and Chromium.
- Every RFC 8785 and RFC 8032 vector in the vendored fixtures passes.
- No private key bytes appear in any log, metric or error output (abuse test).
