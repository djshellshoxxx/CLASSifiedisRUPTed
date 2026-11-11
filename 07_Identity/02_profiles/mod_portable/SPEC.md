# F07.S02.M01 — Portable identity

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F07.S02](../SPEC.md). **Process IDs:** PS-055-01…PS-055-10. **Code:** `packages/identity/src/profiles/portable`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The portable identity document is a signed statement (classrup.identity.portable_doc/v1) that binds a did:key to its current pseudonym, its active and recently revoked device public keys (each active key with its own possession signature, older revocations as key hashes), and up to 5 relays where the owner can be reached. Only the account root key - the key the did:key encodes - signs it over RFC 8785 JCS bytes; each version carries a sequence number and the hash of the previous one, and any vault can verify it offline. Relays store and serve it; vaults store the documents of people they interact with, accept a first document on first contact, buffer chain gaps, detect forks, keep revocations as a grow-only union, and apply revocations made by a recovery only 72 hours after they first saw the recovery notice. Key status follows the single F11 key model - evaluated at the receiver's time, a key the latest verified document marks revoked is refused whatever createdAt claims, and a revocation learned later quarantines the statements first seen at or after its clamped revokesEffectiveAt. It evidences that the holder of the root key asserted these facts - not who the person is, and not delivery of anything. It also answers the key-linkage reads other modules need (N11).

## Responsibilities

- Encode and decode did:key for Ed25519 (multicodec 0xed01, multibase base58btc) and verify that a document's DID matches its signing key.
- Issue a new signed document version from the current Account and DeviceKey state (vault command, root device only) with seq increased by 1 and prev set to the previous cid.
- Receive and store documents of other principals, verify signature, possession proofs, seq and chain, keep provenance, accept the first document on first contact, buffer gaps for 24 hours, and flag forks (same DID and seq with different cid, two documents claiming the same prev, or two recovery notices for one DID) as contested.
- Keep revocations as a grow-only union per DID, require resolving documents to carry every revocation of every competing branch, and hold recovery-driven revocations until 72 hours after this vault's first sight of the recovery notice.
- Serve and accept documents on a relay (public read, signed publish with quotas, at most 20 versions per DID).
- Mark the owner's own current document stale when device keys or the pseudonym change or 150 days pass, and treat any document past expiresAt as expired.
- Publish identity.portable_doc.published for own, received and relay-stored documents, and answer the key-linkage reads key_set, find_by_key and key_status, including the keys removed from documents and the classrup.security.keyrevocation/v1 statements a relay received with them.
- Provide KeyStatusPort, KeyLinkagePort.linked(didA, didB) for F10.S01.M02 legal-hold approval and IdentityRefreshPort.refresh(did, relays) for F16.S02.M02 refresh hints, and declare the injected ports ListedRelaysPort (F11.S03.M01) and SameOwnerLinkPort (F07.S03.M02).
- Clamp revokesEffectiveAt to no earlier than 30 days before this vault's earliest evidence of the revoking document, label clamped values, never drop a revocation that arrives late, and record each key's first-seen time per DID.

## Not responsible for

- Device key and pseudonym management (F07.S01.M01) and recovery (F07.S01.M03), which reports recovery notices and disputes through this module's ports.
- Federation transport and peer policy (F11); this module supplies the signed document that F11 and account migration use.
- Trust in the person behind a key; that comes from attestations and reputation (F07.S03).
- Block lists (F07.S02.M02); blocked DIDs are filtered through the injected BlockFilterPort.
- Future: DID methods other than did:key, rotation of the account root key with a signed move statement (no rotation chain exists in MVP), witness co-signatures.

## User stories

- As a user, my devices and pseudonym are published in a signed document that anyone can verify without trusting a server.
- As a counterparty, I can check that a statement was signed by a key that the author's latest document I hold does not mark revoked, and statements I first saw after a later-learned revocation took effect are set aside.
- As a user who moves to another relay, I publish a new document version listing the new relay, and my history stays intact.
- As a contact, I am warned if two conflicting versions of someone's identity document appear, and no resolution can silently bring back a revoked key.
- As a contact meeting someone whose document is already at version 25, I can still start trusting it, and I see that it was first seen by me now.

## Edge cases

- A document has a valid signature but seq lower than the stored one; it is kept as history and never replaces the current document.
- Two documents have the same DID and seq but different content; both are stored, marked contested, and the UI shows a warning with both device key lists until a resolving document that chains from one branch and lists every revocation of both branches is accepted.
- A document passes its expiresAt (180 days); it remains evidence but is marked expired for trust decisions and the UI prompts a refresh.
- A revoked device key signed a statement; a verifier holding the revoking document refuses it whatever createdAt claims, and a verifier that learns of the revocation later quarantines it if it first saw it at or after the clamped effective time, otherwise keeps it with a revoked-signer marker and the revocation date shown as a claim.
- A revoking document claims revokesEffectiveAt 90 days before this vault first received it; the effective time is clamped to 30 days before that receipt, labelled clamped, and the revocation is applied, never dropped as late.
- The document exceeds 8 KiB or lists more than 20 device key entries or more than 10 active keys; rejected.
- A user who replaced many devices has more revoked keys than entries allow; the newest revoked keys stay listed and older ones move to revokedKeyHashes, and verifiers keep every revocation they already saw.
- First contact with a DID whose relay holds only versions 21 to 25; version 25 is accepted as current on first use and firstSeenAt is recorded.
- Stored seq 3, then seq 5 arrives; the revocations in seq 5 apply at once, seq 5 is buffered for 24 hours while seq 4 is fetched from the listed relays, and is then accepted with a gap flag if no conflicting seq 4 is known.
- A document revokes keys with reason recovery; it is held as recovery pending until 72 hours after this vault first saw the matching recovery notice, and if no notice arrives within 24 hours, or the document's issuedAt is before the notice's own notBefore claim, the DID is contested.
- A relay receives 50 documents per hour for one DID; it refuses beyond 10 per hour.
- Clock skew - issuedAt is 2 hours in the future; verifiers accept up to 10 minutes of skew and quarantine the rest.
- The document's pseudonym differs from the pseudonym in a profile statement from the same DID; the document is authoritative for DID to key binding only, and the UI shows the newest profile's label.
- The relay list contains a non-HTTPS URL or credentials in the URL; rejected.
- A document lists an active key without a valid possession signature, for example another user's device key; rejected with IDENTITY_LINK_INVALID.

## UX and accessibility

- Identity settings > My identity document: DID with copy and QR, fingerprint, current seq, listed devices, relays, 'Publish to relay' per relay with sync state (prepared, relay received, peer accepted), and the note that published versions cannot be recalled.
- Contact details > Identity: document version, 'signature valid', first seen date, fingerprint, and warnings for contested, gap, recovery pending and expired documents.

**States:** loading; current; stale; publishing; gap-pending; recovery-pending; contested; expired; offline-pending; error

**Accessibility:** The DID and fingerprint are shown as text with a copy button and group separators for screen reader pacing.; Contested, gap, recovery pending and expired warnings are text with an icon, announced via aria-live polite.; The QR code has a text equivalent, and all buttons are at least 44 by 44 px.

## Owned data

- `PortableIdentityDoc` (classrup.identity.portable_doc/v1, P0, RET-STANDARD)

## Interfaces

- Commands: `identity.portable_doc.issue`, `identity.portable_doc.receive`, `identity.portable_doc.resolve`, `identity.portable_doc.publish`
- Queries: `identity.portable_doc.get`, `identity.portable_doc.list_contested`, `identity.portable_doc.key_set`, `identity.portable_doc.find_by_key`, `identity.portable_doc.key_status`
- Emits: `identity.portable_doc.published`
- Consumes: `identity.device_key.added`, `identity.device_key.revoked`, `identity.pseudonym.changed`, `privacy.deletion.completed`

## Dependencies

F07.S01.M01, F11.S01.M03, F16.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-055-01 | [Domain schema](domain_schema.md) | 4 |
| PS-055-02 | [Validation rules](validation_rules.md) | 7 |
| PS-055-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-055-04 | [Commands, queries and events](commands_queries_events.md) | 6 |
| PS-055-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-055-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-055-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-055-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-055-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 4 |
| PS-055-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/identity/src/profiles/portable/index.ts`.

## Acceptance criteria

- All tests T01-T31 pass in CI.
- A forked or rolled-back identity document is never silently accepted and no resolution can bring back a revoked key (fork, rollback and union tests).
- No document contains private keys or P3 data and no UI text claims real-world identity verification.
- Recovery-driven revocations are never applied by a verifying vault before 72 hours after its own first sight of the notice.
