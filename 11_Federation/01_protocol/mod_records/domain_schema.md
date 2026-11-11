# PS-084-01 — Domain schema: Federated records

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M02 Federated records](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/records` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-084-01.R01** A FederatedRecord stores the full verified envelope, its cid, author, signer key, chain key (author, signer key, stream), seq, prev, type, audience, recipients and the local provenance object receivedFromRelay, receivedAt, via and verifiedAt, with tenant and revision per CTR-ID-001.
- **PS-084-01.R02** A Tombstone stores target (cid or record id), kind (author tombstone or relay_removal advisory), issuer kind, reason, statement of reasons for advisories, the signed envelope, appliedAt and a stub retention end of at least max(180 days, the target type's maxAge).
- **PS-084-01.R03** Public records are P0 read-only mirrors and participant records are statements decrypted from sealed mailbox envelopes and held only in the vaults of their participants; the record class is P2 because a vault holds participant statements, while a relay stores public-audience records only.
- **PS-084-01.R04** Mirrored records are read-only; purged content leaves only a stub with cid, record key, author, chain key, seq and purgedAt until the stub retention ends, and the stub still satisfies chain continuity for later records.
- **PS-084-01.R05** Chains are scoped per (author, signer key, stream), with stream pub for public projections and one stream per participant thread (thr:<id>), so two devices of one principal never fork each other and a recipient can always obtain every predecessor of its own thread.
- **PS-084-01.R06** A receiver with no head for a chain anchors at the first verified envelope at any seq and records chainAnchor and anchoredAt; the chain then detects equivocation and orders delivery but never gates acceptance.
- **PS-084-01.R07** Commitment statements are indexed by subject key and digest (FederatedRecord.subjectKey and promiseDigest); this promise index, owned here, is what F11.S02.M03 conflict detection reads.

## Specification

### FederatedRecord

Schema `classrup.federation.record/v1` · storage **relay+device** · privacy **P2** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope (vault id in the browser vault) |
| cid | string — cid as defined by F11.S01.M03 (sha256- over JCS of the envelope without sig and cid); unique per tenant |
| audience | enum — public \| participants; participants rows exist only in vaults and are never sent relay to relay |
| recipients? | json — participants only: [{did, mailboxId}] from ext.recipients, 1..20 entries |
| type | string — envelope type registered in F11.S01.M01, e.g. classrup.bazaar.listing/v1 |
| author | string — did:key of the principal (user statements) or of the relay (relay statements); Ed25519 only |
| signerKey | string — did:key that produced the signature: ext.signerKey (a device key of the author) or the author itself |
| stream | string — pub for public projections or thr:<base64url 16 bytes> per participant thread; ≤ 64 chars |
| seq | int — per-chain sequence (author, signerKey, stream), ≥ 1 |
| prev? | string — cid of the seq-1 record of the same chain; absent only when seq = 1 |
| chainAnchor | boolean — true when this was the first envelope this receiver saw of the chain |
| anchoredAt? | timestamp — local clock when the chain was anchored here |
| chainGap | boolean — true when accepted without contiguous predecessors (buffer expiry, gap over 100 or fork re-anchor) |
| recordKey? | string — payload id used to supersede older versions of the same item |
| subjectKey? | string — registry subject key for commitment statements (promise index) |
| promiseDigest? | string — SHA-256 of JCS(payload) for commitment statements; compared by the registry predicate |
| envelope? | json — verified envelope ≤ 262144 bytes (participants ≤ 12288 bytes); null after purge |
| sourceKind | enum — local \| hosted_device \| peer_relay \| mailbox \| direct \| import |
| receivedFromRelay? | string — authenticated sending relay id; null for local, direct, mailbox and import sources; provenance only, never a binding |
| receivedAt | timestamp — RFC 3339 UTC |
| via | string[] — relays seen delivering this cid, display only, ≤ 5 |
| verifiedAt | timestamp — local clock when signature, cid and role verification succeeded |
| claimedAt | timestamp — createdAt from the envelope; a claim of the signer, not evidence |
| relayReceipt? | json — {relayId, at, sig}; relay-signed receipt time, evidence only of that relay's clock |
| signerRole? | string — role the signer was verified to hold for this type, e.g. listing_author, recipient, hosting_relay |
| status | enum — received \| buffered \| held_on_fork \| accepted \| hidden \| quarantined \| rejected \| dropped \| tombstoned |
| statusReason? | enum — chain_gap \| fork \| commitment_conflict \| signer_role_invalid \| signer_key_revoked \| blocked \| blocked_party \| hidden_by_rule \| peer_suspended \| conflict_limit \| tombstoned \| superseded \| operator_dropped \| discarded \| quarantine_expired |
| hiddenByRuleIds? | uuidv7[] — hide rules of F11.S03.M02 currently matching; empty means not hidden by a rule |
| relayRemovals? | json — [{relayId, tombstoneCid, reasonCode}] advisories seen for this record; display only |
| ackCid? | string — cid of the ack this vault signed for a participants statement addressed to it |
| bufferedUntil? | timestamp — receivedAt + 24 h while status buffered |
| supersededBy? | uuidv7 — newer FederatedRecord of the same author and recordKey with a higher seq |
| purgedAt? | timestamp — content removed after an author tombstone, a reject rule or an operator drop |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- cid is unique per tenant and an envelope is verified before any FederatedRecord row exists in status accepted or hidden.
- At most one record per (tenantId, author, signerKey, stream, seq) has status accepted or hidden; a second candidate is quarantined as a fork.
- status accepted implies chainAnchor, chainGap, or prev refers to an accepted, hidden or purged-stub record of the same chain at seq - 1.
- status tombstoned implies envelope is null and purgedAt is set; status hidden keeps the envelope and is reversible.
- A public-audience FederatedRecord is P0 and never contains location finer than geohash 5; a relay never stores a participants-audience row.
- A statement is acted on by domain modules only when status is accepted and signerRole is set; receivedFromRelay never influences acceptance.
- Field classes are annotated per F10.S02.M02 (public rows P0, participants rows P2, provenance P1).

### Tombstone

Schema `classrup.federation.tombstone/v1` · storage **relay+device** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope (vault id in the browser vault) |
| cid | string — cid of the tombstone or relay_removal envelope itself; unique per tenant |
| kind | enum — tombstone (classrup.federation.tombstone/v1) \| relay_removal (classrup.federation.relay_removal/v1) |
| targetCid? | string — cid of the record removed |
| targetRecordKey? | string — record id; an author tombstone removes all versions with this recordKey by the same author principal |
| author | string — did:key that signed: the target's author principal for tombstones, the hosting relay key for advisories |
| signerKey | string — device key (tombstones) or relay key (advisories) that produced the signature |
| issuerKind | enum — author \| origin_relay (origin_relay = hosting-relay advisory; binding only for that relay's own index) |
| relayId? | string — advisories only: the relay whose index the item left |
| reason | enum — owner_withdrawn \| account_deleted \| listing_expired (tombstones) \| moderation_removed \| legal (advisories only) |
| statementOfReasons? | string — advisories only, ≤ 2000 code points plain text, required |
| envelope | json — the signed envelope |
| status | enum — received \| pending_target \| applied \| advisory \| rejected \| expired |
| pendingUntil? | timestamp — receivedAt + 180 days while pending_target |
| appliedAt? | timestamp — when target content was purged |
| stubUntil? | timestamp — appliedAt + max(180 days, maxAge of the target type) |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- Exactly one of targetCid and targetRecordKey is set.
- An author tombstone is applied only when its author principal equals the target record's author principal; targetRecordKey tombstones are bound to the issuer did and touch only that author's records.
- A relay_removal advisory never purges anything outside the issuing relay's own index; in a vault it only annotates the record and the author's own vault records it without effect.
- status applied implies appliedAt and stubUntil are set and stubUntil ≥ appliedAt + 180 days.
- At most 50 pending_target tombstones per issuer and 1000 per tenant exist at any time.

### Storage DDL

```sql
-- relay SQLite shown; the vault uses the same fields in IndexedDB stores fed_record and fed_tombstone with the same unique indexes
CREATE TABLE fed_record (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, cid TEXT NOT NULL, type TEXT NOT NULL, audience TEXT NOT NULL,
  author TEXT NOT NULL, signer_key TEXT NOT NULL, stream TEXT NOT NULL, seq INTEGER NOT NULL, prev TEXT,
  record_key TEXT, subject_key TEXT, received_from_relay TEXT, received_at TEXT NOT NULL,
  status TEXT NOT NULL, buffered_until TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX fed_record_cid ON fed_record(tenant_id, cid);
CREATE UNIQUE INDEX fed_record_chain ON fed_record(tenant_id, author, signer_key, stream, seq) WHERE status IN ('accepted','hidden');
CREATE INDEX fed_record_key ON fed_record(tenant_id, author, record_key, status);
CREATE INDEX fed_record_subject ON fed_record(tenant_id, subject_key, status) WHERE subject_key IS NOT NULL;
CREATE INDEX fed_record_buffer ON fed_record(status, buffered_until) WHERE status = 'buffered';
CREATE TABLE fed_tombstone (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, cid TEXT NOT NULL, kind TEXT NOT NULL, target_cid TEXT,
  target_record_key TEXT, author TEXT NOT NULL, status TEXT NOT NULL, stub_until TEXT, revision INTEGER NOT NULL,
  data TEXT NOT NULL);
CREATE UNIQUE INDEX fed_tombstone_cid ON fed_tombstone(tenant_id, cid);
CREATE INDEX fed_tombstone_target ON fed_tombstone(tenant_id, target_cid);
CREATE INDEX fed_tombstone_key ON fed_tombstone(tenant_id, author, target_record_key);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-084-09.T01 | contract | PS-084-01.R01, PS-084-01.R03, PS-084-04.R01 | ingest valid public listing envelope from peer B | FederatedRecord accepted with sourceKind peer_relay, receivedFromRelay B, via [B], verifiedAt and signerKey set, schema valid; the relay has no participants rows |
| TEST-PS-084-09.T05 | integration | PS-084-01.R05, PS-084-03.R02 | anchored public chain: seq 7 before seq 6, then seq 6 | seq 7 buffered and not served, then both accepted in order; events emitted in seq order |
| TEST-PS-084-09.T07 | integration | PS-084-01.R02, PS-084-03.R03, PS-084-07.R03 | valid owner tombstone for an accepted record | content purged within 1 h, tombstone applied with stubUntil ≥ appliedAt + max(180 days, target maxAge), event emitted |
| TEST-PS-084-09.T09 | integration | PS-084-03.R05, PS-084-01.R02 | author tombstone arrives before its target, 25 h pass, then the target signed by the same author arrives | tombstone still pending_target after 24 h (never applied unchecked); on arrival the target is rejected FEDERATION_TOMBSTONED and the tombstone becomes applied |
| TEST-PS-084-09.T27 | integration | PS-084-01.R06 | fresh vault V2 with no head for seller S receives S's offer decision at seq 57 of thread stream thr:A, then seq 58 | seq 57 accepted as anchor (chainAnchor true, anchoredAt set); seq 58 accepted as next |
| TEST-PS-084-09.T28 | integration | PS-084-01.R05, PS-084-06.R04, PS-084-04.R05 | two offline devices of principal P publish public statements; two producers in one vault publish concurrently through the StatementPublisherPort | different chain keys and no fork; in one vault seq n+1 and n+2 are allocated in their storing transactions and a duplicate head+1 insert fails the unique index |
| TEST-PS-084-09.T30 | integration | PS-084-01.R07 | vault receives two verified consents by signer S on one subject key with different digests | federation.conflict.detect called inside the receive transaction; both quarantined in that same transaction; promise index holds both digests |
| TEST-PS-084-09.T36 | abuse | PS-084-07.R01, PS-084-01.R03 | send a participants statement through relay A's mailbox and inspect A's storage, logs and events | relay holds only the sealed wrapper {v, mailboxId, ciphertext, size, sentAt}; no author DID, type or seq appears anywhere on A |
| TEST-PS-084-09.T38 | integration | PS-084-01.R06, PS-084-01.R04 | vault V2 joins after author X has published 200 public records, some older than 180 days but within maxAge and some tombstoned | V2 anchors at the first record it receives, tombstone stubs satisfy chain continuity, every live record is accepted and the final state equals V1's |
| TEST-PS-084-09.T39 | unit | PS-084-01.R04 | purge an accepted record after an author tombstone | the stored row keeps only cid, recordKey, author, chain key, seq and purgedAt; envelope null |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M03, F11.S02.M02, F11.S02.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F07.S02.M02, F15.S04.M02, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001. Predecessor: [module SPEC](SPEC.md).
