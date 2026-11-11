# F08.S02.M02 — Explicit consent capture

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F08.S02](../SPEC.md). **Process IDs:** PS-062-01…PS-062-10. **Code:** `packages/comms/src/negotiation/consent`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The shared signed consent record used by bazaar offers and negotiations, mutiny proposals and cycles, service bookings, rental reservations and deposits, and meetups. A ConsentStatement binds a signer (did:key) and signer key, a subject reference, the CTR-ID-001 ID-3 cid of the exact subject revision, a statement key and locale naming the displayed wording, and a signing time claim. It is signed as a hash-only F16.S02.M03 envelope with ctx classrup/consent/v1, whose signature covers JCS({v, ctx, kid, alg, signedAt, payloadHash}) with payloadHash the sha256-<base64url> of SHA-256 over the JCS bytes of the signed field set, produced in the signer's vault, sent as a signed statement through any transport, verified by every receiving vault and kept as evidence. Each owning module registers a SubjectCanonicalizerPort for its subject type, so this module can check the current revision, the signer's role and whether the subject is committed. Duplicates resolve to the same record in every vault, a revocation that arrives after an owning module committed makes verify return conflicted so the parties freeze instead of diverging, and validity after a device-key revocation is judged by first-seen time. A consent evidences that a key holder asserted agreement with that exact revision; it is not evidence of delivery, payment or that the other party will perform. Revocation is a second signed statement and never rewrites history.

## Responsibilities

- Own the ConsentStatement record and its signed field set, signed as a hash-only F16.S02.M03 envelope (ctx classrup/consent/v1, payloadHash over the JCS bytes of the exact signed field set) and verified only through F16.S02.M03 verify with the payload, the expected binding and the signer key status.
- Provide the reusable vault command comms.consent.sign that other modules call after showing the user the exact revision and wording, and the pure verify query comms.consent.verify.
- Accept inbound consent statements through comms.consent.accept, verify signer key status, signature, subject hash and role, and store them with provenance and first-seen time or quarantine them with a reason.
- Provide comms.consent.revoke which signs a revocation statement targeting a consent or its dedupe tuple, and report conflicts (consent and decline, or a revocation that arrived after the owning module committed, for one subject hash) so owning modules freeze instead of resolving by timestamp.
- Maintain the registry of statement keys with versions, locales and text hashes so the wording the signer saw can be proven later; v1 registers the keys of every owning feature (bazaar, mutiny, services, rentals, meetups) with subjectType, subjectRef kind, signer role, owning port and wording.
- Define the SubjectCanonicalizerPort {canonicalBytes(ref, rev), currentRevision(ref), partyRole(ref, did), isCommitted(ref)} that each owning module registers for its subjectType by inverted registration (owners depend on this module, never the reverse) - F01.S04.M01 bazaar_offer, F01.S04.M02 bazaar_negotiation, the F02 mutiny modules for mutiny_proposal and mutiny_cycle with F02.S01.M04 canonicalBytes, F03.S02.M01 services_booking, F05.S01.M01 rentals_reservation, F05.S01.M02 rentals_deposit and F08.S03.M03 comms_meetup.
- Resolve duplicates deterministically (lowest cid kept in every vault, others stored as aliases) and register the F10 privacy ports, pseudonymizing signerDid in kept consents on principal deletion (N6).

## Not responsible for

- Deciding what a consent means for a trade, cycle, booking or meetup; the owning modules (F01, F02, F03, F05, F08.S03.M03) decide and call this module.
- Computing the canonical subject bytes, current revision, party roles and commit state; each owning module registers a SubjectCanonicalizerPort for its subjectType (F08.S03.M03 registers it for comms_meetup).
- Key generation and storage (F07.S01.M01, F16.S02.M01), key validity (F07.S02.M01 KeyStatusPort) read through one F16.S02.M02 security.keyrecord.get_status call with freshness, and the signature envelope and context registry (F16.S02.M03).
- Message transport (F08.S01.M01), delivery and outbox states (F11.S02.M01 on F15.S01.M01) and relay forwarding (F11 federation).
- Future: threshold and multi-device co-signing, time-stamping authority anchoring, hardware-key attestation of the signing device.

## User stories

- As a cycle participant, I confirm one exact revision of a proposal and my signature is bound to that revision so a later edit cannot reuse it.
- As a buyer, I can look at a stored consent and see who signed what wording on which revision, and whether the signature verifies.
- As a signer, I can withdraw a consent before the owning module commits, and the withdrawal is itself signed and visible.
- As a counterparty, my device rejects a consent statement signed by someone who is not a party to the subject.
- As a participant, if the other side tells me and a third party different things, both of our devices see the contradiction and the coordination freezes.

## Edge cases

- Subject is revised after the consent was signed; the stored hash no longer equals the current revision hash, so verify returns stale and the owning module asks again.
- Signer signs consent on device A, then device A is revoked; validity is decided by first-seen time, which is provenance.verifiedAt recorded at the first successful verification in this vault and kept through export and import, never signedAtClaim; statements first seen before revocationEffectiveFrom stay valid, statements first seen after it are rejected, vaults may disagree, and owning modules treat a peer-reported invalidity as conflicted.
- Two devices of one signer sign the same consent; both verify, every vault keeps the lexicographically lowest cid as the record and stores the other as an alias, so a revocation or reference resolves the same way everywhere.
- Consent statement arrives before the subject revision it refers to; it waits in quarantine for up to 7 days for the subject and then is erased as unverifiable.
- Signer's clock is wrong by a day; signedAtClaim outside the plus or minus 24 hour window from the receiver clock is accepted but flagged clockSuspect and never used to order consent against revocation.
- A consent and a decline from the same signer exist for one subject hash; verify returns conflicted and owning modules freeze instead of picking the later one.
- Statement key unknown or retired; signing is refused, stored consents with retired keys remain verifiable with the stored text hash, and an inbound statement with a wording version this app does not know yet is quarantined until the registry updates instead of being rejected.
- A revocation arrives after vault A committed and before vault B committed; both store it, A's verify returns conflicted and A's owning module freezes for renegotiation, B's verify returns revoked.
- A signer sends a consent to A and a decline to B; owning modules echo every received consent statement to all participants before commit, so both vaults hold both and verify returns conflicted in each.
- A signer revokes a consent and later consents again to the same revision; the revoked record leaves the dedupe key, so the new consent is a new valid record.

## UX and accessibility

- Confirm sheet: shows the subject summary, revision number and short hash, the full statement wording for the statement key in the signer's locale, a checkbox I have read this, and a Sign button.
- Consent detail: signer pseudonym, key fingerprint, subject revision hash, statement wording version and locale, signed time claim, first seen time, verification result with key freshness, provenance, aliases.
- Revoke sheet: explains that revocation is signed and visible, that it does not undo a commitment already made, and that after the other party committed it freezes the coordination instead.

**States:** loading; ready-to-sign; signing; signed; verified; stale; revoked; conflicted; quarantined; offline-queued

**Accessibility:** The statement wording is real text in the accessibility tree and the Sign button is disabled until the I have read this checkbox is checked.; Verification result is announced as text such as Signature valid for revision 3, not only by icon.; Sign and Revoke are buttons of at least 44 by 44 px with accessible names that include the subject kind.

## Owned data

- `ConsentStatement` (classrup.comms.consent/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `comms.consent.sign`, `comms.consent.revoke`, `comms.consent.accept`
- Queries: `comms.consent.verify`, `comms.consent.list_for_subject`
- Emits: `comms.consent.signed`, `comms.consent.revoked`, `comms.consent.received`
- Consumes: `identity.portable_doc.published`, `identity.device_key.added`, `identity.device_key.revoked`, `privacy.deletion.completed`

## Dependencies

F07.S01.M01, F07.S02.M02, F07.S02.M01, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-COM-001, CTR-IOX-001, CTR-UX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-062-01 | [Domain schema](domain_schema.md) | 5 |
| PS-062-02 | [Validation rules](validation_rules.md) | 6 |
| PS-062-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-062-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-062-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-062-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 4 |
| PS-062-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-062-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-062-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 4 |
| PS-062-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/comms/src/negotiation/consent/index.ts`.

## Acceptance criteria

- All tests T01 to T25 pass in CI.
- Regenerated header-form known-answer vectors (JCS of {v, ctx, kid, alg, signedAt, payloadHash} and Ed25519 signatures under classrup/consent/v1) pass on all supported browsers and Node, equal the F16.S02.M03 consent vectors, and the header bytes and payload hashes are published.
- No code path orders consent against revocation or decline by claimed time.
- The sign sheet states that consent evidences assertion, not delivery or payment, and that pseudonymity is not anonymity.
