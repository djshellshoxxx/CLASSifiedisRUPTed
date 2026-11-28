# PS-129-01 — Domain schema: Key registry and revocation

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M02 Key registry and revocation](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/management` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-129-01.R01** A KeyRecord stores public key, algorithm, purpose, owner principal, relationship, authority (the module whose statement or record is the source of truth), status, validity window, revocation details, the identity document sequence it was taken from, provenance and the revocation freshness, with tenant and revision per CTR-ID-001.
- **PS-129-01.R02** Key records are P1 public data once published; local notes on counterparty keys are P3 in the vault, and KeyRecords are retained under RET-EVIDENCE because signatures are verified against historical status.
- **PS-129-01.R03** Key IDs are unique per public key, and every revoked key is also written to a permanent minimal revoked-key set (key hash, revokedAt, revocationStatementCid) that survives purging of its KeyRecord, so a revoked key is never registered or reactivated again.
- **PS-129-01.R04** For user device keys F07.S02.M01 is the single source of validity; KeyRecords with relationship own, counterparty or relay_hosted are an ingest-only cache of its KeyStatusPort and identity documents, and native records exist only for relay_owned keys (relay transport, VAPID) and peer_relay keys.
- **PS-129-01.R05** Agreement keys are never registered or stored; callers derive a device's X25519 key from its listed Ed25519 key with F16.S02.M01, so no relay or statement can introduce one.
- **PS-129-01.R06** classrup.security.keyrevocation/v1 is the single revocation statement for device keys, with payload { keyId, publicKey, ownerPrincipal, reason, effectiveFrom?, revokedByKey, finalCids? }, where finalCids (reason account_deleted only, at most 120 distinct cids) names the final statements signed in the F10.S01.M04 DeletionPort sign step that verifiers keep accepting after the revocation.
- **PS-129-01.R07** Every key this module shows is displayed with the F07.S01.M01 fingerprint - 16 base58btc characters of SHA-256 over the raw public key, or its 8-word form - and never with keyId or the did:key prefix.

## Specification

### KeyRecord

Schema `classrup.security.keyrecord/v1` · storage **relay+device** · privacy **P1** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — store scope (vault or relay hosting scope) |
| keyId | string — SHA-256 thumbprint of the raw public key, base64url, 43 chars |
| publicKey | string — raw public key, base64url |
| algorithm | enum — ed25519 \| ecdsa_p256 (VAPID only) |
| purpose | enum — device_signing \| relay_transport \| vapid \| peer_relay |
| ownerPrincipal | did:key — principal DID the key belongs to; for relay keys the relay did:key |
| relationship | enum — own \| counterparty \| relay_hosted \| relay_owned \| peer_relay |
| authority | enum — f07_identity (user keys) \| f15_relay_identity \| relay_config (VAPID) \| f11_peer_pin |
| status | enum — active \| revocation_pending \| contested \| revoked \| expired |
| docSeq? | int — seq of the F07.S02.M01 identity document the status was taken from (user keys) |
| docCid? | string — cid of that identity document |
| notBefore | timestamp — RFC 3339 UTC, claimed by the linking statement or relay record |
| notAfter? | timestamp — RFC 3339 UTC (relay_owned and retired relay transport keys) |
| firstSeenAt | timestamp — RFC 3339 UTC, this store's clock |
| pendingUntil? | timestamp — revocation_pending only, recorded time + 7 days |
| revokedAt? | timestamp — RFC 3339 UTC, this store's clock when the revocation was first received |
| revocationEffectiveFrom? | timestamp — claimed effective time, clamped to no earlier than earliestEvidenceAt minus 30 days and no later than revokedAt |
| earliestEvidenceAt? | timestamp — earliest verified relay receipt time of the revoking statement or document, else this store's first receipt |
| effectiveFromClamped? | boolean — true when the claim reached further back and was clamped |
| revocationReason? | enum — compromised \| lost \| stolen \| superseded \| retired \| recovery \| account_deleted \| administrative (relay_owned keys only) |
| finalCids? | string[] — account_deleted only; at most 120 cids copied from the verified keyrevocation statement, honoured only while the key's authority reports it revoked with reason account_deleted |
| revocationStatementCid? | string — content id of the verified revocation statement or identity document |
| freshnessCheckedAt | timestamp — RFC 3339 UTC, when knowledge for this key was last refreshed |
| freshnessIssuedAt? | timestamp — issuedAt of the newest verified list head or identity document confirming the status |
| freshnessSources | string[] — relay IDs or peer IDs that confirmed the status at freshnessIssuedAt, or own |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- status revoked is permanent; a key whose hash is in the revoked-key set can never be active again, even after its KeyRecord is purged.
- revocationEffectiveFrom is never earlier than earliestEvidenceAt minus 30 days and never later than revokedAt.
- Own keys have freshnessSources [own] and are always fresh; counterparty keys carry the real age and number of sources of their knowledge.
- A KeyRecord with relationship own, counterparty or relay_hosted never has a status that F07.S02.M01 does not report for that key.
- finalCids is present only with revocationReason account_deleted and never makes a revoked key active; it only marks the listed statements as acceptable.

### Storage DDL

```sql
CREATE TABLE security_key_record (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, key_id TEXT NOT NULL, algorithm TEXT NOT NULL, purpose TEXT NOT NULL,
  owner_principal TEXT NOT NULL, relationship TEXT NOT NULL, authority TEXT NOT NULL, status TEXT NOT NULL, revoked_at TEXT,
  freshness_checked_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX security_key_unique ON security_key_record(tenant_id, key_id) WHERE status != 'expired';
CREATE INDEX security_key_owner ON security_key_record(tenant_id, owner_principal, status);
CREATE TABLE security_revoked_key (
  tenant_id TEXT NOT NULL, key_hash TEXT NOT NULL, revoked_at TEXT NOT NULL, revocation_statement_cid TEXT NOT NULL,
  PRIMARY KEY (tenant_id, key_hash));
CREATE TRIGGER security_revoked_key_permanent BEFORE DELETE ON security_revoked_key BEGIN SELECT RAISE(ABORT, 'permanent'); END;
CREATE TABLE security_revocation_list_head (
  tenant_id TEXT NOT NULL, relay_id TEXT NOT NULL, list_seq INTEGER NOT NULL, issued_at TEXT NOT NULL, next_update_by TEXT NOT NULL,
  head_hash TEXT NOT NULL, signature TEXT NOT NULL, fetched_at TEXT NOT NULL, PRIMARY KEY (tenant_id, relay_id));
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-129-09.T01 | unit | PS-129-01.R01, PS-129-01.R02, PS-129-01.R04, PS-129-04.R02 | identity.portable_doc.published (received) adding Kq for Q; identity.device_key.added for own K2 | counterparty and own KeyRecords stored active with authority f07_identity, keyId equals thumbprint, security.key.registered carries publicKey |
| TEST-PS-129-09.T03 | property | PS-129-01.R03, PS-129-03.R01, PS-129-09.R02 | random sequences of revocations, pending periods, counter-revocations, root decisions, expiries and purges | revoked and expired never change; a revoked key never returns, also after its KeyRecord is purged |
| TEST-PS-129-09.T16 | integration | PS-129-04.R04, PS-129-01.R05 | get for a keyId; get_status for a user key; lookup of an agreement key | publicKey, algorithm and purpose returned; KeyStatusPort called exactly once with (did, publicKey, at) and freshness added; no agreement record exists |
| TEST-PS-129-09.T19 | integration | PS-129-01.R06, PS-129-04.R07 | relay records P's account_deleted revocation of K1 listing cids c1 and c2 through record_revocation, then receives statements c1 and c3 signed by K1; get_status with statementCid c1 and c3; F07 later reports K1 revoked by the root key for compromise | c1 finalListed true and accepted by F16.S02.M03 verify; c3 finalListed false and refused with SECURITY_KEY_REVOKED; after the compromise report c1 finalListed false |
| TEST-PS-129-09.T20 | unit | PS-129-01.R06, PS-129-02.R01 | account_deleted revocation with 121 cids; finalCids on a revocation with reason lost; a valid one with 120 cids serialized as a CTR-FED-001 envelope | VALIDATION_FAILED twice; the 120-cid statement verifies and stays under the 8 KiB relay statement limit |
| TEST-PS-129-09.T22 | unit | PS-129-01.R07 | own key list, counterparty key detail, relay operator view and revoke confirmation rendered for F07.S01.M01 fingerprint vectors | every fingerprint equals fingerprintOf (16 base58btc characters, or the 8-word form on request); no keyId or did:key prefix is shown |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M03, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
