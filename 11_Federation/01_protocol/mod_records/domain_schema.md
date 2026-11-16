# PS-084-01 — Domain schema: Federated records

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M02 Federated records](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/records` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-084-01.R01** A FederatedRecord stores the full verified envelope, its cid, author, seq, prev, type and the local provenance object originRelay, receivedAt, via and verifiedAt, with tenant and revision per CTR-ID-001.
- **PS-084-01.R02** A Tombstone stores target (cid or record id), issuer kind, reason, the signed tombstone envelope, appliedAt and expiresAt equal to appliedAt plus 180 days.
- **PS-084-01.R03** Public records are P0 read-only mirrors and participant records are ciphertext statements; the record class is P2 because it can hold ciphertext addressed to participants.
- **PS-084-01.R04** Mirrored records are read-only; purged content leaves only a stub with cid, author, type and purgedAt until the tombstone expires.

## Specification

### FederatedRecord

Schema `classrup.federation.record/v1` · storage **relay+device** · privacy **P2** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope (vault id in the browser vault) |
| cid | string — sha256-base64url of JCS(envelope without sig); unique per tenant |
| audience | enum — public \| participants; participants envelopes carry ciphertext in payload and are never sent relay to relay |
| type | string — envelope type, e.g. classrup.bazaar.listing/v1 |
| author | string — did:key of the signer; Ed25519 only |
| seq | int — per-author sequence, ≥ 1 |
| prev? | string — cid of seq-1 record of the same author; absent only when seq = 1 |
| recordKey? | string — payload id used to supersede older versions of the same item |
| envelope? | json — verified envelope ≤ 262144 bytes; null after purge |
| originRelay | string — relay id that sent it, bound to the author's home relay |
| receivedAt | timestamp — RFC 3339 UTC |
| via | string[] — relays that forwarded it; MVP length ≤ 1 |
| verifiedAt | timestamp — local clock when signature and cid verification succeeded |
| claimedAt | timestamp — createdAt from the envelope; a claim of the signer, not evidence |
| relayReceipt? | json — {relayId, at, sig}; relay-signed receipt time, evidence only of that relay's clock |
| signerRole? | string — role the signer was verified to hold for this type, e.g. listing_author |
| status | enum — received \| buffered \| accepted \| quarantined \| rejected \| dropped \| tombstoned |
| statusReason? | enum — gap_timeout \| fork \| signer_role_invalid \| blocked \| peer_suspended \| tombstoned \| superseded \| operator_dropped |
| bufferedUntil? | timestamp — receivedAt + 24 h while status buffered |
| supersededBy? | uuidv7 — newer FederatedRecord of the same recordKey |
| purgedAt? | timestamp — content removed after tombstone, block rule or flag-off purge |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- cid is unique per tenant and an envelope is verified before any FederatedRecord row exists in status accepted.
- At most one record per (tenantId, author, seq) has status accepted; a second candidate is quarantined.
- status accepted implies prev refers to an accepted record of the same author or seq is 1.
- status tombstoned implies envelope is null and purgedAt is set.
- A public-audience FederatedRecord is P0 and never contains location finer than geohash 5; a participants-audience record holds only ciphertext and routing metadata and a relay never stores its plaintext.
- A statement is acted on by domain modules only when status is accepted and signerRole is set.

### Tombstone

Schema `classrup.federation.tombstone/v1` · storage **relay** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| cid | string — cid of the tombstone envelope itself; unique per tenant |
| targetCid? | string — cid of the record removed |
| targetRecordKey? | string — record id; removes all versions by the same author |
| author | string — did:key that signed the tombstone or the origin relay did |
| issuerKind | enum — author \| origin_relay |
| reason | enum — owner_withdrawn \| account_deleted \| listing_expired \| moderation_removed \| legal |
| envelope | json — signed tombstone envelope, classrup.federation.tombstone/v1 |
| status | enum — received \| pending_target \| applied \| rejected \| expired |
| appliedAt? | timestamp — when content was purged |
| expiresAt? | timestamp — appliedAt + 180 days |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |

**Invariants**
- Exactly one of targetCid and targetRecordKey is set.
- status applied implies appliedAt and expiresAt are set and expiresAt = appliedAt + 180 days.
- A tombstone issuer is the target's author or the target's origin relay; any other issuer is rejected.

### Storage DDL

```sql
-- relay SQLite shown; the vault uses the same fields in an IndexedDB store fed_record with the same unique indexes
CREATE TABLE fed_record (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, cid TEXT NOT NULL, type TEXT NOT NULL, author TEXT NOT NULL,
  seq INTEGER NOT NULL, prev TEXT, record_key TEXT, origin_relay TEXT NOT NULL, received_at TEXT NOT NULL,
  status TEXT NOT NULL, buffered_until TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX fed_record_cid ON fed_record(tenant_id, cid);
CREATE UNIQUE INDEX fed_record_chain ON fed_record(tenant_id, author, seq) WHERE status = 'accepted';
CREATE INDEX fed_record_key ON fed_record(tenant_id, author, record_key, status);
CREATE INDEX fed_record_buffer ON fed_record(status, buffered_until) WHERE status = 'buffered';
CREATE TABLE fed_tombstone (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, cid TEXT NOT NULL, target_cid TEXT, target_record_key TEXT,
  author TEXT NOT NULL, status TEXT NOT NULL, expires_at TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX fed_tombstone_cid ON fed_tombstone(tenant_id, cid);
CREATE INDEX fed_tombstone_target ON fed_tombstone(tenant_id, target_cid);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-084-09.T01 | contract | PS-084-01.R01, PS-084-01.R03, PS-084-04.R01 | ingest valid listing envelope from B | FederatedRecord accepted with provenance originRelay B, via [], verifiedAt set, status readable, schema valid |
| TEST-PS-084-09.T05 | integration | PS-084-03.R02, PS-084-01.R02 | seq 7 before seq 6, then seq 6 | seq 7 buffered then both accepted in order; events emitted in seq order |
| TEST-PS-084-09.T07 | integration | PS-084-01.R02, PS-084-03.R03, PS-084-07.R02 | valid owner tombstone for accepted record | content purged within 1 h, tombstone applied with expiresAt = appliedAt + 180 days, event emitted |
| TEST-PS-084-09.T25 | integration | PS-084-01.R04, PS-084-02.R01, PS-084-03.R01 | vault receives accept-offer statement signed by a key that is not the listing author | quarantined with statusReason signer_role_invalid, no domain event, user can discard |
| TEST-PS-084-09.T26 | integration | PS-084-06.R01, PS-084-01.R04 | publish while relay is down, then relay returns receipt, then peer acknowledgement | UI states local committed, transport_acknowledged, peer_accepted in order and never more than reached |
| TEST-PS-084-09.T20 | integration | PS-084-07.R03, PS-084-01.R03 | media from origin with hot-link URL and 6 MiB image | fetched by relay only, oversize skipped, no client request reaches origin |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M03, F11.S02.M02, F11.S02.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S04.M02, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001. Predecessor: [module SPEC](SPEC.md).
