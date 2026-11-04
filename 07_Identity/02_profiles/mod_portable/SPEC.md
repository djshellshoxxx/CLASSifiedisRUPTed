# F07.S02.M01 — Portable identity

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F07.S02](../SPEC.md). **Process IDs:** PS-055-01…PS-055-10. **Code:** `packages/identity/src/profiles/portable`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The portable identity document is a signed statement (classrup.identity.portable_doc/v1) that binds a did:key to its current pseudonym, its active and recently revoked device public keys, and up to 5 relays where the owner can be reached. The account signing key signs it over RFC 8785 JCS bytes, each version carries a sequence number and the hash of the previous one, and any vault can verify it offline. Relays store and serve it; vaults store the documents of people they interact with and detect forks. It evidences that the holder of the key asserted these facts - not who the person is, and not delivery of anything.

## Responsibilities

- Encode and decode did:key for Ed25519 (multicodec 0xed01, multibase base58btc) and verify that a document's DID matches its signing key.
- Issue a new signed document version from the current Account and DeviceKey state (vault command) with seq increased by 1 and prev set to the previous cid.
- Receive and store documents of other principals, verify signature, seq and chain, keep provenance, and flag forks (same DID and seq with different cid, or two documents claiming the same prev) as contested.
- Serve and accept documents on a relay (public read, signed publish with quotas, at most 20 versions per DID).
- Mark the owner's own current document stale when device keys or the pseudonym change, prompting reissue.

## Not responsible for

- Device key and pseudonym management (F07.S01.M01) and recovery (F07.S01.M03).
- Federation transport and peer policy (F11); this module supplies the signed document that F11 and account migration use.
- Trust in the person behind a key; that comes from attestations and reputation (F07.S03).
- Future: DID methods other than did:key, key rotation of the account signing key with a signed move statement, witness co-signatures.

## User stories

- As a user, my devices and pseudonym are published in a signed document that anyone can verify without trusting a server.
- As a counterparty, I can check that a statement was signed by a key that the author's document lists as active.
- As a user who moves to another relay, I publish a new document version listing the new relay, and my history stays intact.
- As a contact, I am warned if two conflicting versions of someone's identity document appear.

## Edge cases

- A document has a valid signature but seq lower than the stored one; it is kept as history and never replaces the current document.
- Two documents have the same DID and seq but different content; both are stored, marked contested, and the UI shows a warning with both device key lists until a higher seq signed document resolves it.
- A document is older than its expiresAt (180 days); it remains evidence but is marked expired for trust decisions and the UI prompts a refresh.
- A revoked device key signed a statement before the verifier saw the revocation; the verifier accepts it and the UI shows the revocation date as a claim.
- The document exceeds 8 KiB or lists more than 20 device keys; rejected.
- A relay receives 50 documents per hour for one DID; it refuses beyond 10 per hour.
- Clock skew - issuedAt is 2 hours in the future; verifiers accept up to 10 minutes of skew and quarantine the rest.
- The document's pseudonym differs from the pseudonym in a profile statement from the same DID; the document is authoritative for DID to key binding only, and the UI shows the newest profile's label.
- The relay list contains a non-HTTPS URL or credentials in the URL; rejected.

## UX and accessibility

- Identity settings > My identity document: DID with copy and QR, current seq, listed devices, relays, 'Publish to relay' per relay with sync state (prepared, relay received, peer accepted).
- Contact details > Identity: document version, 'verified signature', 'contested' warning, key fingerprint.

**States:** loading; current; stale; publishing; contested; expired; offline-pending; error

**Accessibility:** The DID and fingerprint are shown as text with a copy button and group separators for screen reader pacing.; Contested and expired warnings are text with an icon, announced via aria-live polite.; The QR code has a text equivalent, and all buttons are at least 44 by 44 px.

## Owned data

- `PortableIdentityDoc` (classrup.identity.portable_doc/v1, P0, RET-STANDARD)

## Interfaces

- Commands: `identity.portable_doc.issue`, `identity.portable_doc.receive`, `identity.portable_doc.publish`
- Queries: `identity.portable_doc.get`, `identity.portable_doc.list_contested`
- Emits: `identity.portable_doc.published`
- Consumes: `identity.device_key.added`, `identity.device_key.revoked`, `identity.pseudonym.changed`, `privacy.deletion.completed`

## Dependencies

F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-055-01 | [Domain schema](domain_schema.md) | 3 |
| PS-055-02 | [Validation rules](validation_rules.md) | 3 |
| PS-055-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-055-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-055-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-055-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-055-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-055-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-055-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-055-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/identity/src/profiles/portable/index.ts`.

## Acceptance criteria

- All tests T01-T15 pass in CI.
- A forked or rolled-back identity document is never silently accepted (fork and rollback tests).
- No document contains private keys or P3 data and no UI text claims real-world identity verification.
