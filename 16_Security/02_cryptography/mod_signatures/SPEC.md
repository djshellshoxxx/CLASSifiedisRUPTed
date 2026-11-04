# F16.S02.M03 — Signatures

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F16.S02](../SPEC.md). **Process IDs:** PS-130-01…PS-130-10. **Code:** `packages/security/src/cryptography/signatures`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Domain-separated Ed25519 sign and verify helpers and the signature envelope used for consents, receipts, attestations, key statements and relay requests. A signature covers the context string, the signer key ID and the RFC 8785 canonical bytes of the payload, so a signature made for one purpose cannot be replayed for another. Verification checks the algorithm, context, canonical form and signature, then asks the key registry (F16.S02.M02) for the signer's status and revocation freshness, and reports a structured result. A valid signature is evidence that the holder of a key asserted a statement; it is not evidence of delivery, physical handover, payment or real-world identity, and timestamps inside a statement are claims by the signer.

## Responsibilities

- Provide sign(context, payload, keyHandle) and verify(envelope, expectedContext, policy) as pure helpers over @noble/curves 2.4.0 Ed25519, with strict RFC 8032 verification.
- Define and enforce the signature envelope classrup.security.envelope/v1 with context, signer key ID, algorithm, signed-at claim, payload hash and signature.
- Maintain the context registry (classrup/consent/v1, receipt/v1, attestation/v1, key-link/v1, key-rotation/v1, key-revoke/v1, relay-request/v1, revocation-list/v1, login/v1, export-manifest/v1) and reject unknown contexts.
- Canonicalize payloads with RFC 8785 JCS, rejecting non-canonical inputs, duplicate keys, non-integer numbers and lone surrogates.
- [object Object]

## Not responsible for

- Key generation and storage (F16.S02.M01) and the key registry (F16.S02.M02).
- The federation envelope signature (F11.S01.M03), which uses the CTR-FED-001 FED-2 rule of signing JCS bytes of the envelope without a prefix, and is the only user of the raw signJcs entry point.
- Domain meaning of consents, receipts and attestations (F08.S02.M02, F09.S02.M01, F07.S03.M02).
- Future: Ed448 or post-quantum hybrid signatures; threshold signatures; timestamp authority countersignatures.

## User stories

- As a trade participant, I sign my consent to exactly revision 4 of a proposal, and nobody can reuse that signature for revision 5 or another action.
- As a verifier, I see 'valid, signer key active, revocation checked 3 hours ago' or 'valid, but revocation status unknown for 9 days'.
- As a developer, I add a new signed statement type by registering a context string and a payload schema, and the helper refuses anything else.

## Edge cases

- Same payload signed under two contexts produces different signatures and verification under the wrong expected context fails with SECURITY_CONTEXT_MISMATCH.
- Payload contains a float, a duplicate key, or unsorted keys that differ from the canonical form; verify recomputes canonical bytes and rejects non-canonical envelopes with SECURITY_PAYLOAD_NOT_CANONICAL.
- Signature with non-canonical S value or small-order public key; strict verification rejects it with SECURITY_SIGNATURE_INVALID.
- signedAt claim is 3 days in the future or 40 days in the past; verify returns valid with clockClaim flagged, because signedAt is only a claim, and policy decides whether to accept.
- Signer key revoked with effectiveFrom 10 days ago and the statement was received 2 days ago; the result is valid-but-flagged 'signed during claimed compromise' per the registry rules.
- Registry freshness unknown because the vault was offline for 9 days; the result carries freshness unknown, and a high-stakes policy turns it into a refusal until the user refreshes or acknowledges.
- Payload larger than 64 KiB; refused with PAYLOAD_TOO_LARGE before any hashing.

## UX and accessibility

- Signature detail panel: signer fingerprint, context in words, payload binding (entity, revision), verification result, key status with freshness, honesty note.

**States:** valid-fresh; valid-stale; valid-flagged; invalid; unknown-signer; revoked

**Accessibility:** Result is stated in words with an icon, not color alone.; The panel is a labelled region that is reachable by keyboard and announces changes politely.; Honesty note is plain text, not a tooltip.

Headless library with one visible surface: the signature detail panel on a consent, receipt or attestation, showing plain-language lines 'Signed by key orbit-maple-quiet-river for: consent to proposal revision 4', 'Signature valid', 'Key status: active, revocation last checked 3 hours ago', and a clear note that a signature proves the key holder asserted the statement and does not prove delivery or handover.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F16.S02.M02, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-130-01 | [Domain schema](domain_schema.md) | 3 |
| PS-130-02 | [Validation rules](validation_rules.md) | 3 |
| PS-130-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-130-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-130-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-130-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-130-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-130-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-130-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-130-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/security/src/cryptography/signatures/index.ts`.

## Acceptance criteria

- All tests T01–T13 pass in CI with RFC 8032 and RFC 8785 vectors.
- No signature validates under a context other than the one it was made for (property tests).
- Every verify result carries key status and revocation freshness, and the UI states what a signature does not prove.
