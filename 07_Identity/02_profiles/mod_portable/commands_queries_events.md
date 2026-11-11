# PS-055-04 — Commands, queries and events: Portable identity

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M01 Portable identity](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/portable` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-055-04.R01** Issue is a vault command that produces the root-signed statement classrup.identity.portable_doc/v1; receive is the vault intake of someone else's document; resolve is the user's explicit choice for a contested DID; publish and the public read are relay endpoints.
- **PS-055-04.R02** The event identity.portable_doc.published is emitted when a document is issued locally, when a received document changes a DID's current document or status, and when a relay stores a verified document, in the same transaction as the state change.
- **PS-055-04.R03** Documents are public P0 statements and are only sent to relays the owner selected, after privacy.consent.check(federation_publish, relayId), or directly to peers.
- **PS-055-04.R04** Key-linkage reads (N11) return the key set and seq chain of a DID, the DIDs that list a given key, and a key's status at a point in time; there is no account key rotation chain in MVP.
- **PS-055-04.R05** Counterparty modules learn of other people's key changes only from identity.portable_doc.published with origin received, which carries the added and revoked keys; identity.device_key events describe only the local principal's keys.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `identity.portable_doc.issue` | identity.portable_doc.issue | { relays?: array of at most 5 URLs, expectedSeq } | { docId, seq, cid, statement: classrup.identity.portable_doc/v1 (signed by the root key), syncState: local_committed, skippedRelays: array (no federation_publish consent) } | CONFLICT_STATE, CONFLICT_REVISION, VALIDATION_FAILED, IDENTITY_ROOT_KEY_REQUIRED | identity.portable_doc.published | yes (Idempotency-Key) |
| `identity.portable_doc.receive` | identity.portable_doc.receive | { document: classrup.identity.portable_doc/v1, provenance } | { docId, status: current\|gap_pending\|recovery_pending\|superseded\|contested\|history, did, seq } | IDENTITY_DOC_SIGNATURE_INVALID, IDENTITY_DOC_CHAIN_INVALID, IDENTITY_LINK_INVALID, VALIDATION_FAILED, RATE_LIMITED | identity.portable_doc.published | yes (Idempotency-Key) |
| `identity.portable_doc.resolve` | identity.portable_doc.resolve | { did, chosenCid, expectedRevision } | { did, currentCid, seq, status: current } | NOT_FOUND, CONFLICT_STATE, CONFLICT_REVISION, IDENTITY_DOC_CHAIN_INVALID | identity.portable_doc.published | yes (Idempotency-Key) |
| `identity.portable_doc.publish` | identity.portable_doc.publish | { document: classrup.identity.portable_doc/v1 } | { docId, seq, cid, storedAt } | IDENTITY_DOC_SIGNATURE_INVALID, IDENTITY_DOC_CHAIN_INVALID, IDENTITY_LINK_INVALID, VALIDATION_FAILED, RATE_LIMITED | identity.portable_doc.published | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `identity.portable_doc.get` | identity.portable_doc.read_public | { did, seq?, includeHistory?: boolean } | { document: classrup.identity.portable_doc/v1, status, provenance, firstSeenAt, history?: array of at most 20 } | NOT_FOUND |
| `identity.portable_doc.list_contested` | identity.portable_doc.read_own | { limit? (1..50) } | { items: [{ did, versions: array, contestReason, detectedAt }] } |  |
| `identity.portable_doc.key_set` | identity.portable_doc.read_linkage | { did: did:key } | { did, seq, currentCid, activeKeys: publicKey[], revokedKeys: [{ publicKey, revokedAt?, revokeReason? }], revokedKeyHashes, seqChain: [{ seq, cid, status }], contested: boolean } | NOT_FOUND |
| `identity.portable_doc.find_by_key` | identity.portable_doc.read_linkage | { publicKey } | { items: [{ did, status: active\|revoked\|pending\|contested, seq }] } |  |
| `identity.portable_doc.key_status` | identity.portable_doc.read_linkage | { did, publicKey, at?: timestamp (default now; local first-seen time of the statement being verified) } | { status: active\|revoked\|unknown, revokedAt?, learnedAt, contested: boolean, recoveryPending: boolean } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `identity.portable_doc.published` | P0 | { did, seq, cid, origin: own\|received\|relay_stored, status, addedKeys: publicKey[], revokedKeys: [{ publicKey, revokesEffectiveAt, revokeReason }], gap, issuedAt } |

### Events consumed

| Type | Effect |
|---|---|
| `identity.device_key.added` | own document becomes stale and the reissue prompt is shown on the root device |
| `identity.device_key.revoked` | own document becomes stale; reissue lists the key as revoked with revokesEffectiveAt, or in revokedKeyHashes when entries are full |
| `identity.pseudonym.changed` | own document becomes stale until reissued |
| `privacy.deletion.completed` | final cleanup only - the DeletionPort steps already queued a signed tombstone for the own document to the relays (PRV-6) and deleted or pseudonymized the stored documents |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| IDENTITY_DOC_SIGNATURE_INVALID | 422 | no | DID derivation or Ed25519 signature check failed |
| IDENTITY_DOC_CHAIN_INVALID | 409 | no | seq or prev does not extend the stored chain, a resolving document omits a revocation, or a revoked key is listed as active again |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements and signer roles (N2): classrup.identity.portable_doc/v1 - only the DID root key (the key encoded in the did:key). Ports provided: KeyStatusPort.isActive(did, publicKey, at) and keyStatus(did, publicKey, at) for every verifier (F07.S01.M01, F07.S01.M02, F07.S02.M02, F07.S03.M01, F07.S03.M02 and other features), implementing the rule 'signer key active in the author's document at this vault's first-seen time of the statement'; recordRecoveryNotice(did, noticeCid, newDevicePublicKey, notBeforeClaim, firstSeenAt) and recordRecoveryDispute(did, disputeCid, signerKey) for F07.S01.M03. Injected port: BlockFilterPort.isBlocked(did), implemented by F07.S02.M02 and wired by the vault composition root because F07.S02.M02 depends on this module (N7); a blocked DID's document is dropped silently with no error to the intake pipeline or the sender.

### Example

```
vault command (root device): identity.portable_doc.issue { "expectedSeq": 3, "relays": ["https://relay.example.org"] }
-> { "docId": "0192f430-…", "seq": 4, "cid": "sha256-Qm…", "syncState": "local_committed", "skippedRelays": [], "statement": { "v": 1, "type": "classrup.identity.portable_doc/v1", "author": "did:key:z6Mk…", "seq": 4, "prev": "sha256-Zx…", "payload": { "pseudonym": "Riverstone", "deviceKeys": [ { "publicKey": "…", "status": "active", "linkNonce": "…", "possessionSig": "…" } ], "revokedKeyHashes": [], "relays": [ … ] }, "sig": "…root…" } }
relay query: POST /api/v1/query/identity.portable_doc.get { "did": "did:key:z6Mk…" } -> 200 { "document": { … }, "status": "current" }
vault query: identity.portable_doc.key_status { "did": "did:key:z6Mk…", "publicKey": "…", "at": "2026-11-04T10:00:00.000Z" } -> { "status": "active", "learnedAt": "…", "contested": false, "recoveryPending": false }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-055-09.T07 | contract | PS-055-04.R01, PS-055-04.R02 | commands, queries and the event run | outputs, statement and payload validate against registry schemas; published carries origin, status, addedKeys and revokedKeys |
| TEST-PS-055-09.T08 | integration | PS-055-03.R01, PS-055-04.R02 | own device key added, pseudonym changed, and 150 days pass | own current document becomes stale each time; reissue creates seq plus 1, supersedes it and emits published with origin own |
| TEST-PS-055-09.T21 | contract | PS-055-04.R04 | key_set, find_by_key and key_status at points in time with active, revoked, pending and contested keys | outputs validate and match the fixtures; key_status at a time before the revocation was learned returns active |
| TEST-PS-055-09.T22 | integration | PS-055-04.R05, PS-055-04.R03 | receive a counterparty document that adds D3 and revokes D1; the same document again; issue with one relay lacking federation_publish consent | published with origin received, addedKeys [D3] and revokedKeys [D1]; nothing emitted for the duplicate; the relay without consent is skipped and shown |

## Dependencies

Module depends on: F07.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
