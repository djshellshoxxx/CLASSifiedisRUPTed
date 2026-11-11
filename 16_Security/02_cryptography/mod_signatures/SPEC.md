# F16.S02.M03 — Signatures

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F16.S02](../SPEC.md). **Process IDs:** PS-130-01…PS-130-10. **Code:** `packages/security/src/cryptography/signatures`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Domain-separated signature envelope (classrup.security.envelope/v1) for consents, receipts, revocation-list heads and release holds, and the system-wide inventory of every signing prefix and signature format. It has no cryptographic primitives of its own: RFC 8785 JCS, strict Ed25519 and did:key come from F11.S01.M03, which is their single owner. A signature covers the RFC 8785 bytes of the header { v, ctx, kid, alg, signedAt, payloadHash } with payloadHash = SHA-256 of the JCS bytes of the payload, so context, key, version, algorithm, signing-time claim and payload are all bound. Verification takes the payload (inline, or supplied by the caller for hash-only envelopes), the caller's expected context and binding, and the signer's key status as an input (from F07.S02.M01 KeyStatusPort for user keys, from F16.S02.M02 for relay-owned and peer relay keys), and returns one accepted flag that is true only when every check passes. Device-to-relay HTTP requests use the F11.S01.M03 RFC 9421 profile with tag classrup/relay-request/v1; there is no second request scheme. A valid signature is evidence that the holder of a key asserted a statement; it is not evidence of delivery, physical handover, payment or real-world identity, and timestamps inside a statement are claims by the signer.

## Responsibilities

- Provide sign(context, payload, keyHandle, options) and verify(envelope, expectations, keyStatus, payload?) as pure helpers over the F11.S01.M03 JCS and strict RFC 8032 Ed25519 primitives, with no canonicalizer, Ed25519 or did:key implementation of its own.
- Define and enforce the envelope classrup.security.envelope/v1 { v, ctx, kid, alg, signedAt, payloadHash, payload?, sig } with sig over JCS({ v, ctx, kid, alg, signedAt, payloadHash }) and payloadHash = sha256-<base64url> of SHA-256(JCS(payload)).
- Maintain the signing-prefix inventory - every signing prefix and signature format in the system with its owner module, signer, payload schema and binding - reject contexts outside it, and run the repository-wide prefix-ambiguity check.
- Bind exact revisions for revision-bound contexts with the F08.S02.M02 field names (subjectType, subjectRef, subjectRevision, subjectRevisionHash, statementKey) and return accepted false on any mismatch.
- Own the envelope error codes, including SECURITY_KEY_REVOKED for a caller-supplied revoked status, so the key registry F16.S02.M02 depends on this module and not the reverse.

## Not responsible for

- Key generation, key handles and storage (F16.S02.M01).
- Key status - user keys from F07.S02.M01 KeyStatusPort, relay-owned and peer relay keys from F16.S02.M02; verify receives the status as an input and never looks it up.
- RFC 8785 canonicalization, Ed25519, did:key, RFC 9421 HTTP request signatures and CTR-FED-001 envelope signing (F11.S01.M03), and the CTR-FED-001 statement-type registry with signer roles (F11.S01.M01).
- Domain meaning of consents, receipts and release holds (F08.S02.M02, F09.S02.M01, F16.S03.M03).
- Future: Ed448 or post-quantum hybrid signatures; threshold signatures; timestamp authority countersignatures.

## User stories

- As a trade participant, I sign my consent to exactly revision 4 of a proposal, and nobody can reuse that signature for revision 5 or another action.
- As a verifier, I see 'accepted, signer key active, status checked 3 hours ago' or 'signature valid but not accepted - signed for revision 4, current revision is 5'.
- As a developer, I add a new signing context by registering it in the inventory with its owner, payload schema and binding, and the helper and the inventory check refuse anything else.

## Edge cases

- Same payload signed under two contexts produces different signatures, and verification under the wrong expected context returns accepted false with SECURITY_CONTEXT_MISMATCH.
- Payload contains a float, a duplicate key, or unsorted keys that differ from the canonical form; verify recomputes canonical bytes and returns SECURITY_PAYLOAD_NOT_CANONICAL.
- Signature with non-canonical S value or small-order public key; strict verification in F11.S01.M03 rejects it and verify returns SECURITY_SIGNATURE_INVALID.
- signedAt claim is 3 days in the future or 40 days in the past; it is covered by the signature so it cannot be changed in transit, but it is still only a claim, so verify flags clockClaim and the caller's policy decides.
- Key status supplied by the caller says the signer key was revoked before this vault first saw the statement; verify returns accepted false with SECURITY_KEY_REVOKED.
- A final deletion statement is signed by a device key that was then revoked with reason account_deleted; the caller-supplied status is revoked with finalListed true, so verify returns accepted true with flag finalStatement, while any other statement by that key returns SECURITY_KEY_REVOKED.
- Key status is active but its freshness is unknown because the vault was offline for 9 days; verify returns accepted true with freshnessClass unknown, never upgraded, and a high-stakes policy refuses until the user refreshes or acknowledges.
- Payload larger than 64 KiB; refused with PAYLOAD_TOO_LARGE before any hashing.
- A hash-only envelope is verified with a payload whose JCS hash differs from payloadHash, or with no payload at all; accepted false with SECURITY_PAYLOAD_HASH_MISMATCH.
- A consent signed for revision 4 is checked against revision 5; the signature is valid but accepted is false with SECURITY_BINDING_MISMATCH.
- A login challenge signature (classrup-login:v1) is presented as a consent envelope; it fails because the envelope's signed bytes begin with the header JCS and can never equal a login string.
- A new context is proposed whose prefix is a prefix of an existing entry, or a challenge context lacks an expiry; the inventory check fails CI naming both entries.

## UX and accessibility

- Signature detail panel: signer fingerprint, context in words, payload binding (subject, revision, statement key), accepted or the reason it is not, key status with freshness, honesty note.

**States:** accepted-fresh; accepted-stale; accepted-flagged; not-accepted; unknown-signer; revoked

**Accessibility:** Result is stated in words with an icon, not color alone.; The panel is a labelled region that is reachable by keyboard and announces changes politely.; Honesty note is plain text, not a tooltip.

Headless library with one visible surface: the signature detail panel on a consent, receipt or release hold, showing plain-language lines 'Signed by key 7Hq3mK9sLp2xV4nR (F07.S01.M01 fingerprintOf) for: consent to proposal revision 4', 'Accepted' or 'Not accepted - signed for a different revision', 'Key status: active, last checked 3 hours ago', and a clear note that a signature proves the key holder asserted the statement and does not prove delivery or handover.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F11.S01.M03, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-130-01 | [Domain schema](domain_schema.md) | 5 |
| PS-130-02 | [Validation rules](validation_rules.md) | 4 |
| PS-130-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-130-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-130-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-130-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-130-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-130-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-130-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-130-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/security/src/cryptography/signatures/index.ts`.

## Acceptance criteria

- All tests T01–T20 pass in CI with RFC 8032 and RFC 8785 vectors.
- No signature validates under a context other than the one it was made for (property tests), and the inventory has no prefix-ambiguous entries.
- Every verify result carries one accepted flag, key status and freshness, and the UI states what a signature does not prove.
