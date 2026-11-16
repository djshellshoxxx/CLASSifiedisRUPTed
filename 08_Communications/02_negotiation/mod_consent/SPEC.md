# F08.S02.M02 — Explicit consent capture

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F08.S02](../SPEC.md). **Process IDs:** PS-062-01…PS-062-10. **Code:** `packages/comms/src/negotiation/consent`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The shared signed consent record used by bazaar offers, mutiny proposals and cycles, service bookings and rental reservations. A ConsentStatement binds a signer (did:key), a subject reference, the SHA-256 of the RFC 8785 JCS bytes of the exact subject revision, a statement key naming the displayed wording, and a signing time claim under an Ed25519 signature with a domain-separated context. It is produced in the signer's vault, sent as a signed statement through any transport, verified by every receiving vault and kept as evidence. A consent evidences that a key holder asserted agreement with that exact revision; it is not evidence of delivery, payment or that the other party will perform. Revocation is a second signed statement and never rewrites history.

## Responsibilities

- Own the ConsentStatement record and its canonical signing bytes (domain-separated Ed25519 over JCS).
- Provide the reusable vault command comms.consent.sign that other modules call after showing the user the exact revision and wording, and the pure verify query comms.consent.verify.
- Accept inbound consent statements through comms.consent.accept, verify signer key, signature, subject hash and status, and store them with provenance or quarantine them with a reason.
- Provide comms.consent.revoke which signs a revocation statement, and report conflicts (consent and decline, or consent and revocation, for one subject hash) so owning modules freeze instead of resolving by timestamp.
- Maintain the registry of statement keys with versions and text hashes so the wording the signer saw can be proven later.

## Not responsible for

- Deciding what a consent means for a trade, cycle or booking; the owning modules (F01, F02, F03, F05) decide and call this module.
- Computing the canonical subject bytes; each owning module provides a SubjectCanonicalizerPort that returns JCS bytes of its revision.
- Key generation, storage and revocation of device keys (F07.S01.M01, F16.S02.M01, F16.S02.M03 signatures primitives).
- Message transport (F08.S01.M01) and relay forwarding (F11 federation).
- Future: threshold and multi-device co-signing, time-stamping authority anchoring, hardware-key attestation of the signing device.

## User stories

- As a cycle participant, I confirm one exact revision of a proposal and my signature is bound to that revision so a later edit cannot reuse it.
- As a buyer, I can look at a stored consent and see who signed what wording on which revision, and whether the signature verifies.
- As a signer, I can withdraw a consent before the owning module commits, and the withdrawal is itself signed and visible.
- As a counterparty, my device rejects a consent statement signed by someone who is not a party to the subject.

## Edge cases

- Subject is revised after the consent was signed; the stored hash no longer equals the current revision hash, so verify returns stale and the owning module asks again.
- Signer signs consent on device A, then device A is revoked; consents signed before the revocation statement time stay valid, those claimed after it are rejected, and the signing time is only a claim from the signer.
- Two devices of one signer sign the same consent; both verify and are stored as duplicates with the same dedupe key, one is kept.
- Consent statement arrives before the subject revision it refers to; it waits in quarantine for up to 7 days for the subject and then expires as unverifiable.
- Signer's clock is wrong by a day; signedAtClaim outside the plus or minus 24 hour window from the receiver clock is accepted but flagged clockSuspect and never used to order consent against revocation.
- A consent and a decline from the same signer exist for one subject hash; verify returns conflicted and owning modules freeze instead of picking the later one.
- Statement key unknown or retired; signing is refused, but stored consents with retired keys remain verifiable with the stored text hash.

## UX and accessibility

- Confirm sheet: shows the subject summary, revision number and short hash, the full statement wording for the statement key, a checkbox I have read this, and a Sign button.
- Consent detail: signer pseudonym, key fingerprint, subject revision hash, statement wording version, signed time claim, verification result, provenance.
- Revoke sheet: explains that revocation is signed and visible and that it does not undo a commitment already made.

**States:** loading; ready-to-sign; signing; signed; verified; stale; revoked; conflicted; quarantined; offline-queued

**Accessibility:** The statement wording is real text in the accessibility tree and the Sign button is disabled until the I have read this checkbox is checked.; Verification result is announced as text such as Signature valid for revision 3, not only by icon.; Sign and Revoke are buttons of at least 44 by 44 px with accessible names that include the subject kind.

## Owned data

- `ConsentStatement` (classrup.comms.consent/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `comms.consent.sign`, `comms.consent.revoke`, `comms.consent.accept`
- Queries: `comms.consent.verify`, `comms.consent.list_for_subject`
- Emits: `comms.consent.signed`, `comms.consent.revoked`, `comms.consent.received`
- Consumes: `identity.device_key.revoked`, `identity.device_key.added`, `privacy.deletion.completed`

## Dependencies

F07.S01.M01, F16.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-COM-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-062-01 | [Domain schema](domain_schema.md) | 3 |
| PS-062-02 | [Validation rules](validation_rules.md) | 3 |
| PS-062-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-062-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-062-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-062-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-062-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-062-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-062-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-062-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/comms/src/negotiation/consent/index.ts`.

## Acceptance criteria

- All tests T01 to T14 pass in CI.
- Known-answer vectors for JCS bytes and Ed25519 signatures pass on all supported browsers and Node.
- No code path orders consent against revocation or decline by claimed time.
- The sign sheet states that consent evidences assertion, not delivery or payment, and that pseudonymity is not anonymity.
