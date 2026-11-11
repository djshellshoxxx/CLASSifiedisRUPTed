# PS-084-04 — Commands, queries and events: Federated records

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M02 Federated records](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/records` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-084-04.R01** The module exposes relay inbox ingest, vault receive, publish, tombstone issue, discard and release commands plus read queries with the signatures below.
- **PS-084-04.R02** Each command emits exactly the listed events in the same transaction as the state change, one event per envelope outcome.
- **PS-084-04.R03** The module consumes block, peer, conflict, migration, identity document, deletion and listing lifecycle events to keep mirrors consistent with policy.
- **PS-084-04.R04** When receive accepts a participants statement whose ext.recipients names the local principal, it signs a classrup.federation.ack/v1 over that exact cid on the same thread stream and stores it, so F11.S02.M01 routes it to the sender's mailbox; incoming acks are received like any statement and reach F11.S02.M01 through federation.record.accepted.
- **PS-084-04.R05** federation.record.publish and federation.tombstone.issue are the only signing path for the vault principal and the relay key; the listing, offering and expiry consumers link an existing tombstoneCid and issue a tombstone only when none exists for that target, so one withdrawal never spends two seq numbers.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `federation.record.ingest` | federation.record.ingest | [relay command, relay policy] { batchId: uuidv7, envelopes: Envelope[1..100] (audience public only) } over POST /fed/v1/inbox with RFC 9421 signature headers from an allowlisted peer relay or a hosted vault device key; participant traffic never uses this endpoint (F08.S01.M01 mailbox) | { batchId, results: [ { cid, outcome: accepted\|duplicate\|buffered\|held\|hidden\|quarantined\|rejected, code?, relayReceipt? } ] } | FEATURE_DISABLED, FEDERATION_PEER_NOT_ALLOWED, FEDERATION_REQUEST_SIGNATURE_INVALID, FEDERATION_BATCH_TOO_LARGE, FEDERATION_QUOTA_EXCEEDED, FEDERATION_ORIGIN_MISMATCH, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | federation.record.accepted, federation.record.rejected, federation.tombstone.applied | yes (Idempotency-Key) |
| `federation.record.receive` | federation.record.receive | [vault-local command] { envelopes: Envelope[1..100], source: { kind: relay\|direct\|mailbox\|import, relayId? } } fetched by the sync engine or unsealed from mailbox envelopes; the vault verifies and decides, the source is never trusted | { results: [ { cid, outcome: accepted\|duplicate\|buffered\|held\|hidden\|quarantined\|rejected, code?, ackCid? } ] } | FED_SIGNATURE_INVALID, FEDERATION_CID_MISMATCH, FEDERATION_SIGNER_ROLE_INVALID, FEDERATION_PAYLOAD_INVALID, FEDERATION_NOT_ACCEPTED, FEDERATION_RECORD_TIME_INVALID, FEDERATION_TOMBSTONED, FEDERATION_BATCH_TOO_LARGE, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | federation.record.accepted, federation.record.rejected, federation.tombstone.applied | yes (Idempotency-Key) |
| `federation.record.publish` | federation.record.publish | [vault-local command (relay-local for relay-key types); produces a signed statement of the given type; seq and prev allocated in the storing transaction] { type, audience: public\|participants, payload (F11.S01.M01 draft payload for public portable types, ciphertext from the source module for participants, registry schema for control types), recipients?: [{did, mailboxId}] (participants, 1..20), stream?: thr:<id> (participants; default pub), sourceRecordId? (public portable types, for the opt-in check), supersedes?: cid[] } | { cid, seq, chainKey: {author, signerKey, stream}, syncState: local_committed } | FEDERATION_AUTHOR_NOT_OWNED, FEDERATION_NOT_OPTED_IN, FEDERATION_PAYLOAD_INVALID, CONFLICT_STATE, VALIDATION_FAILED, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | federation.record.accepted | yes (Idempotency-Key) |
| `federation.tombstone.issue` | federation.tombstone.issue | [vault-local command produces classrup.federation.tombstone/v1 for the principal's own records; relay-local operator command produces classrup.federation.relay_removal/v1 for items in this relay's index] { targetCid?, targetRecordKey?, reason: owner_withdrawn\|account_deleted\|listing_expired (tombstone) or moderation_removed\|legal (relay_removal), statementOfReasons? (required for relay_removal, ≤ 2000) } | { tombstoneCid, kind: tombstone\|relay_removal, appliedAt?, syncState: local_committed } | NOT_FOUND, FEDERATION_TOMBSTONE_UNAUTHORIZED, VALIDATION_FAILED, DEPENDENCY_UNAVAILABLE | federation.tombstone.applied | yes (Idempotency-Key) |
| `federation.record.discard` | federation.record.discard | [vault-local command in the vault; relay command under relay policy] { recordId, expectedRevision } | { recordId, revision, status: dropped } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | federation.record.rejected | yes (Idempotency-Key) |
| `federation.record.release` | federation.record.release | [relay command under relay policy] { recordId, expectedRevision } for a record quarantined with statusReason peer_suspended; signature and role are re-verified first | { recordId, revision, status: accepted } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FED_SIGNATURE_INVALID, FEDERATION_SIGNER_ROLE_INVALID | federation.record.accepted | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `federation.record.get` | federation.record.read_public | { cid } or { author, recordKey } | { record: MirrorView with provenance { receivedFromRelay, via, receivedAt, verifiedAt, claimedAt, relayReceipt?, relayRemovals? } } | NOT_FOUND, FEATURE_DISABLED |
| `federation.record.list_by_author` | federation.record.read_public | { author, type?, cursor?, limit ≤ 50 } | { items: MirrorView[], nextCursor? } | FEATURE_DISABLED |
| `federation.record.head` | federation.record.read_head | { author, signerKey?, stream? } | { chains: [ { signerKey, stream, seq, cid, anchored } ] } for the latest accepted records, or { chains: [] } | FEDERATION_AUTHOR_NOT_OWNED |
| `federation.record.list_rejections` | federation.record.read_provenance | { peerId?, code?, since?, cursor?, limit ≤ 100 } | { items: [ { cidPrefix, sourceKind, peerId?, code, at } ], nextCursor? } | FORBIDDEN |
| `federation.record.list_quarantined` | federation.record.read_provenance | { statusReason?, cursor?, limit ≤ 100 } | { items: [ { recordId, cidPrefix, type, statusReason, quarantinedAt, dropsAt? } ], nextCursor? } | FORBIDDEN |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `federation.record.accepted` | P2 | { recordId, cid, type, author, signerKey, stream, seq, audience, recipients?: [{did, mailboxId}], sourceKind, receivedFromRelay?, local: boolean (authored by this vault's principal, or on a relay signed by this relay's key), chainGap } — P2 in vaults because participants statements produce it; relays emit it for public records only |
| `federation.record.rejected` | P1 | { cidPrefix, sourceKind, peerId?, code, reason, suppressedCount? } — no author, type or payload |
| `federation.tombstone.applied` | P0 | { tombstoneId, tombstoneCid, kind: tombstone\|relay_removal, issuerKind: author\|origin_relay, advisory: boolean, relayId?, targetCid?, targetRecordKey?, author, signerKey, reason, stubUntil? } |

### Events consumed

| Type | Effect |
|---|---|
| `federation.block_rule.changed` | branch on payload.action: reject added or activated purges matching accepted and hidden records (author, cid, content_hash; peer: records whose only provenance is that peer) to dropped within 1 h; hide added or activated sets hiddenByRuleIds without purging; disabled, removed or expired of a hide rule returns records no longer matched by any hide rule to accepted; changes of reject rules restore nothing, a later re-delivery is processed from scratch |
| `federation.peer.suspended` | relay only: stop accepting from the peer immediately; when the reason is compromise, quarantine (peer_suspended) public records received only from that peer in the last 24 h for operator release or discard |
| `federation.conflict.detected` | quarantine every candidate cid not already quarantined (detections opened by other modules, for example F11.S03.M03 moves) and hold envelopes chaining from them as held_on_fork |
| `federation.conflict.resolved` | using candidateCids, decision and keptCid: keep releases the kept record to accepted and drops the others; drop_all drops every candidate; superseded drops the candidates with reason superseded; held_on_fork successors are released or dropped per the declared transitions |
| `federation.account.moved` | update the fetch hints (relays to fetch the author's records from) after verifying the signed move statement; acceptance never depends on it |
| `identity.portable_doc.published` | origin received: newly revoked device keys are refused from now on (V15) and accepted records by those keys first seen at or after revokesEffectiveAt are quarantined (signer_key_revoked); the relays list refreshes fetch hints |
| `privacy.deletion.requested` | issue an author tombstone with reason account_deleted for every own federated record through federation.tombstone.issue (idempotent per target) |
| `privacy.deletion.completed` | pseudonymize the deleted principal's DID in retained provenance and rejection rows and delete remaining non-evidence rows of that principal (N6) |
| `bazaar.listing.unpublished` | link the payload tombstoneCid to the own listing record; issue a tombstone (owner_withdrawn) only when the event carries none and no own tombstone for that target exists |
| `bazaar.listing.expired` | issue a tombstone (listing_expired) for the federated listing only when no own tombstone for that recordKey exists yet; tombstone.issue is idempotent per target, so the F01.S01.M03 publication end and this consumer never produce two |
| `services.offering.withdrawn` | link an existing own tombstone for projectionCid; issue one with payload tombstoneReason only when none exists for that target |
| `platform.flag.changed` | when F11 turns off, relay-to-relay ingest stops and federated mirrors are hidden from reads; vault to relay sharing and local statements continue; data is retained per CTR-FLG-001 FLG-3 |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| FEDERATION_BATCH_TOO_LARGE | 413 | no | more than 100 envelopes, body over 4194304 bytes, envelope over 262144 bytes or participants envelope over 12288 bytes |
| FEDERATION_NOT_ACCEPTED | 422 | no | envelope or destination refused by local policy; reason intentionally generic |
| FEDERATION_RECORD_TIME_INVALID | 422 | no | createdAt older than the type's maxAge or more than 10 minutes in the future |
| FEDERATION_TOMBSTONED | 410 | no | the record was withdrawn by an applied author tombstone |
| FEDERATION_ORIGIN_MISMATCH | 403 | no | a peer relay sent something relays never forward to each other (a participants statement or sealed mailbox traffic); authorship is never decided by the sender |
| FEDERATION_TOMBSTONE_UNAUTHORIZED | 403 | no | tombstone not signed by the target's author principal, or removal advisory not signed by a relay hosting the item |
| FEDERATION_AUTHOR_NOT_OWNED | 403 | no | the envelope author or signer key does not belong to the local principal or relay |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
POST /fed/v1/inbox
Signature-Input: sig1=("@method" "@target-uri" "content-digest");created=1793786400;keyid="relay:b.example#k1";nonce="0192f3a4-0000-7000-8000-0000000000aa";alg="ed25519"
Signature: sig1=:...:   Content-Digest: sha-256=:Zm9v...:   Idempotency-Key: 0192f3a4-0000-7000-8000-0000000000aa
{ "batchId": "0192f3a4-0000-7000-8000-0000000000aa", "envelopes": [ { "v": 1, "type": "classrup.bazaar.listing/v1", "cid": "sha256-Qm...", "author": "did:key:z6MkRoot...", "createdAt": "2026-11-04T09:58:00.000Z", "seq": 5, "prev": "sha256-9f...", "payload": { "id": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "title": "Road bike" }, "ext": { "stream": "pub", "audience": "public", "signerKey": "did:key:z6MkDev..." }, "sig": "..." } ] }
200 { "batchId": "0192f3a4-0000-7000-8000-0000000000aa", "results": [ { "cid": "sha256-Qm...", "outcome": "accepted", "relayReceipt": { "relayId": "relay:a.example", "at": "2026-11-04T10:00:00.120Z", "sig": "..." } } ] }
vault: federation.record.receive { envelopes: [offer_decision seq 57 on thr:Hk2...], source: { kind: "mailbox" } } -> { results: [ { cid: "sha256-Ac...", outcome: "accepted", ackCid: "sha256-Ak..." } ] }   // anchored, ack queued to the sender's mailbox
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-084-09.T01 | contract | PS-084-01.R01, PS-084-01.R03, PS-084-04.R01 | ingest valid public listing envelope from peer B | FederatedRecord accepted with sourceKind peer_relay, receivedFromRelay B, via [B], verifiedAt and signerKey set, schema valid; the relay has no participants rows |
| TEST-PS-084-09.T15 | integration | PS-084-04.R01, PS-084-04.R02, PS-084-06.R02 | batch of 100 with 3 invalid envelopes | 97 accepted, 3 rejected with codes, results in request order, 97 accepted events and 3 rejected events |
| TEST-PS-084-09.T16 | contract | PS-084-04.R02, PS-084-04.R03, PS-084-09.R02, PS-084-09.R03 | each command and event; every consumed event per the effect table; shared golden envelopes | payload and results validate against registry schemas; golden cids and signatures verify; consumed events handled per effect table |
| TEST-PS-084-09.T28 | integration | PS-084-01.R05, PS-084-06.R04, PS-084-04.R05 | two offline devices of principal P publish public statements; two producers in one vault publish concurrently through the StatementPublisherPort | different chain keys and no fork; in one vault seq n+1 and n+2 are allocated in their storing transactions and a duplicate head+1 insert fails the unique index |
| TEST-PS-084-09.T31 | integration | PS-084-04.R04 | seller vault accepts a participants offer whose ext.recipients names the seller; the ack reaches the buyer vault | ack signed over the exact cid on the same thread stream and stored; record.accepted for the ack in the buyer vault reaches F11.S02.M01; a statement not addressed to the principal gets no ack |
| TEST-PS-084-09.T32 | integration | PS-084-04.R05 | bazaar.listing.unpublished with tombstoneCid; bazaar.listing.expired after F01.S01.M03 already issued a tombstone through the port; services.offering.withdrawn without a tombstone | no second tombstone and no extra seq for the first two; one tombstone issued for the third |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M03, F11.S02.M02, F11.S02.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F07.S02.M02, F15.S04.M02, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
