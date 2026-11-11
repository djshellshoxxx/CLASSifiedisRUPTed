# PS-084-04 — Commands, queries and events: Federated records

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M02 Federated records](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/records` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-084-04.R01** The module exposes inbox ingest, local submit and tombstone issue commands plus read queries with the signatures below.
- **PS-084-04.R02** Each command emits exactly the listed events in the same transaction as the state change, one event per envelope outcome.
- **PS-084-04.R03** The module consumes block, peer, conflict, migration, deletion and listing lifecycle events to keep mirrors consistent with policy.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `federation.record.ingest` | federation.record.ingest | [relay command, relay policy] { batchId: uuidv7, envelopes: Envelope[1..100] } over POST /fed/v1/inbox with request signature headers from an allowlisted peer relay or a registered vault device key | { batchId, results: [ { cid, outcome: accepted\|duplicate\|buffered\|quarantined\|rejected, code?, relayReceipt? } ] } | FEATURE_DISABLED, FEDERATION_PEER_NOT_ALLOWED, FEDERATION_REQUEST_SIGNATURE_INVALID, FEDERATION_BATCH_TOO_LARGE, FEDERATION_QUOTA_EXCEEDED, RATE_LIMITED | federation.record.accepted, federation.record.rejected, federation.tombstone.applied | yes (Idempotency-Key) |
| `federation.record.receive` | federation.record.receive | [vault-local command] { envelopes: Envelope[1..100], source: relayId\|direct\|mailbox } fetched by the sync engine; the vault verifies and decides, the source is never trusted | { results: [ { cid, outcome: accepted\|duplicate\|buffered\|quarantined\|rejected, code? } ] } | FED_SIGNATURE_INVALID, FEDERATION_SIGNER_ROLE_INVALID, FEDERATION_PAYLOAD_INVALID, FEDERATION_NOT_ACCEPTED, FEDERATION_RECORD_TIME_INVALID, FEDERATION_TOMBSTONED, FEDERATION_ORIGIN_MISMATCH, FEDERATION_BATCH_TOO_LARGE | federation.record.accepted, federation.record.rejected, federation.tombstone.applied | yes (Idempotency-Key) |
| `federation.record.publish` | federation.record.publish | [vault-local command; produces a signed statement of the envelope type chosen by the source module, e.g. classrup.bazaar.listing/v1] { sourceRecordId, type, audience: public\|participants, recipients? } | { cid, seq, syncState: local_committed, outboxId } | FEDERATION_AUTHOR_NOT_OWNED, FEDERATION_NOT_OPTED_IN, FED_SIGNATURE_INVALID, FEDERATION_PAYLOAD_INVALID, CONFLICT_STATE, VALIDATION_FAILED, RATE_LIMITED | federation.record.accepted | yes (Idempotency-Key) |
| `federation.tombstone.issue` | federation.tombstone.issue | [vault-local command; produces signed statement classrup.federation.tombstone/v1; relays may also issue origin_relay tombstones for content they host] { targetCid?, targetRecordKey?, reason: owner_withdrawn\|account_deleted\|listing_expired\|moderation_removed\|legal } | { tombstoneCid, appliedAt, expiresAt, syncState: local_committed } | NOT_FOUND, FEDERATION_TOMBSTONE_UNAUTHORIZED, VALIDATION_FAILED | federation.tombstone.applied | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `federation.record.get` | federation.record.read_public | { cid } or { author, recordKey } | { record: MirrorView with provenance { originRelay, receivedAt, via, verifiedAt, claimedAt, relayReceipt? } } | NOT_FOUND, FEATURE_DISABLED |
| `federation.record.list_by_author` | federation.record.read_public | { author, type?, cursor?, limit ≤ 50 } | { items: MirrorView[], nextCursor? } | FEATURE_DISABLED |
| `federation.record.head` | federation.record.read_head | { author } | { seq, cid } for the latest accepted record, or { seq: 0 } | FEDERATION_AUTHOR_NOT_OWNED |
| `federation.record.list_rejections` | federation.record.read_provenance | { peerId?, code?, since?, cursor?, limit ≤ 100 } | { items: [ { cidPrefix, peerId, code, at } ], nextCursor? } | FORBIDDEN |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `federation.record.accepted` | P0 | { recordId, cid, type, author, seq, originRelay, local: boolean } |
| `federation.record.rejected` | P0 | { cidPrefix, peerId, code, reason, suppressedCount? } |
| `federation.tombstone.applied` | P0 | { tombstoneId, tombstoneCid, targetCid?, targetRecordKey?, author, reason, expiresAt } |

### Events consumed

| Type | Effect |
|---|---|
| `federation.block_rule.changed` | purge accepted mirrors matching a new author, cid or hash rule within 1 h and set status tombstoned with reason blocked |
| `federation.peer.suspended` | relay only: stop accepting from the peer immediately; quarantine its records received in the last 24 h when the suspension reason is compromise |
| `federation.conflict.detected` | set both candidate records to quarantined and hide them from readers |
| `federation.conflict.resolved` | release the kept record to accepted and drop the others |
| `federation.account.moved` | rebind the author's originRelay to the new home relay after verifying the signed move record |
| `privacy.deletion.requested` | issue an owner tombstone with reason account_deleted for every federated record of the user's did keys |
| `bazaar.listing.unpublished` | issue tombstone reason owner_withdrawn when the listing was federated |
| `bazaar.listing.expired` | issue tombstone reason listing_expired when the listing was federated |
| `services.offering.withdrawn` | issue tombstone reason owner_withdrawn when the offering was federated |
| `platform.flag.changed` | when F11 turns off, relay-to-relay ingest stops and federated mirrors are hidden; vault to relay sharing and local statements continue; data is retained per CTR-FLG-001 FLG-3 |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| FED_SIGNATURE_INVALID | 400 | no | envelope signature or cid check failed (CTR-FED-001 FED-2) |
| FEDERATION_REQUEST_SIGNATURE_INVALID | 401 | no | relay request signature, digest or date check failed |
| FEDERATION_PAYLOAD_INVALID | 422 | no | payload has members outside the allowlist or exceeds size limits |
| FEDERATION_NOT_OPTED_IN | 403 | no | the owner has not enabled federation for this record |
| FEDERATION_SIGNER_ROLE_INVALID | 422 | no | signer key does not hold the role this statement type requires; statement quarantined |
| FEDERATION_PEER_NOT_ALLOWED | 403 | no | sender is not an active allowlisted peer relay or registered device key |
| FEDERATION_BATCH_TOO_LARGE | 413 | no | more than 100 envelopes, body over 4194304 bytes or envelope over 262144 bytes |
| FEDERATION_QUOTA_EXCEEDED | 429 | yes | peer exceeded its envelope or batch quota; retryAfterMs set |
| FEDERATION_NOT_ACCEPTED | 422 | no | envelope refused by local policy; reason intentionally generic |
| FEDERATION_RECORD_TIME_INVALID | 422 | no | createdAt older than 180 days or more than 10 minutes in the future |
| FEDERATION_TOMBSTONED | 410 | no | the record was withdrawn by a tombstone |
| FEDERATION_ORIGIN_MISMATCH | 403 | no | sender is not the relay bound to the author |
| FEDERATION_TOMBSTONE_UNAUTHORIZED | 403 | no | tombstone not signed by the author or origin relay |
| FEDERATION_AUTHOR_NOT_OWNED | 403 | no | the envelope author key does not belong to the local principal |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
POST /fed/v1/inbox
X-Relay-Key-Id: relay:b.example#k1   Date: Wed, 04 Nov 2026 10:00:00 GMT   Digest: sha-256=:Zm9v...:
Idempotency-Key: 0192f3a4-0000-7000-8000-0000000000aa
{ "batchId": "0192f3a4-0000-7000-8000-0000000000aa", "envelopes": [ { "v": 1, "type": "classrup.bazaar.listing/v1", "cid": "sha256-Qm...", "author": "did:key:z6Mk...", "createdAt": "2026-11-04T09:58:00.000Z", "seq": 5, "prev": "sha256-9f...", "payload": { "id": "0192f3a4-5b6c-7d8e-9f01-23456789abcd", "title": "Road bike" }, "ext": {}, "sig": "..." } ] }
200 { "batchId": "0192f3a4-0000-7000-8000-0000000000aa", "results": [ { "cid": "sha256-Qm...", "outcome": "accepted" } ] }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-084-09.T01 | contract | PS-084-01.R01, PS-084-01.R03, PS-084-04.R01 | ingest valid listing envelope from B | FederatedRecord accepted with provenance originRelay B, via [], verifiedAt set, status readable, schema valid |
| TEST-PS-084-09.T15 | integration | PS-084-04.R01, PS-084-04.R02, PS-084-06.R02 | batch of 100 with 3 invalid envelopes | 97 accepted, 3 rejected with codes, results in request order, 97 accepted events and 3 rejected events |
| TEST-PS-084-09.T16 | contract | PS-084-04.R02, PS-084-04.R03, PS-084-09.R02, PS-084-09.R03 | each command and event | payload and results validate against registry schemas; consumed events handled per effect table |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M03, F11.S02.M02, F11.S02.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S04.M02, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
