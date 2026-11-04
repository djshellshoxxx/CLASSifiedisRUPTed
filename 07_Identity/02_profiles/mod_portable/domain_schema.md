# PS-055-01 — Domain schema: Portable identity

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M01 Portable identity](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/portable` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-055-01.R01** A PortableIdentityDoc stores the signed document bytes' fields, its cid, sequence, previous cid, status and provenance, for the owner's own versions and for received versions of others.
- **PS-055-01.R02** The signed payload lists the DID, seq, prev, pseudonym, device keys with statuses, relays and issuedAt/expiresAt, and is at most 8 KiB.
- **PS-055-01.R03** Statuses express verification outcomes - current, stale (own, needs reissue), superseded and contested - and never imply real-world identity.

## Specification

### PortableIdentityDoc

Schema `classrup.identity.portable_doc/v1` · storage **relay+device** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| did | did — did:key subject, derived from the account signing key |
| seq | int — starts at 1, increases by exactly 1 per version of one DID |
| prev? | string — cid of the previous version; absent for seq 1 |
| cid | string — sha256-base64url of JCS(document without sig) per CTR-ID-001 ID-3 |
| pseudonym | string — display label claimed by the owner, 3..32 code points |
| deviceKeys | array — at most 20 entries { publicKey (43 chars), status: active\|revoked, addedAt, revokedAt?, revokesEffectiveAt? } |
| relays | array — at most 5 HTTPS URLs without credentials or query, each at most 255 characters |
| issuedAt | timestamp — the owner's claim |
| expiresAt | timestamp — issuedAt plus 180 days |
| sig | string — Ed25519 signature by the account signing key over JCS bytes, base64url |
| origin | enum — own \| received \| relay_stored |
| provenance | object — { originRelay?, via: array, receivedAt (local clock), verifiedAt (local clock) } per CTR-FED-001 FED-6 |
| status | enum — current \| stale \| superseded \| contested |
| statementSyncState? | enum — local_committed \| prepared \| transport_acknowledged \| peer_accepted (own documents only) |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- sig verifies against the public key encoded in did over JCS bytes of the document without sig.
- For one DID, seq values are unique among non-contested documents and prev equals the cid of the version seq minus 1.
- Serialized signed document is at most 8 192 bytes.
- Exactly one document per DID has status current unless the DID is contested.

### Storage DDL

```sql
CREATE TABLE identity_portable_doc (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, did TEXT NOT NULL, seq INTEGER NOT NULL, cid TEXT NOT NULL,
  status TEXT NOT NULL, origin TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX identity_portable_doc_cid ON identity_portable_doc(tenant_id, cid);
CREATE INDEX identity_portable_doc_did ON identity_portable_doc(tenant_id, did, seq);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-055-09.T01 | unit | PS-055-01.R01, PS-055-01.R02, PS-055-02.R01 | issue seq 1 then seq 2 for a fixed account | statement signature verifies over JCS bytes, did starts with did:key:z6Mk, cid computed per ID-3, size under 8 KiB |
| TEST-PS-055-09.T02 | property | PS-055-01.R02, PS-055-02.R01 | 1 000 random Ed25519 keys | did:key encode and decode round trip; every did starts with z6Mk |
| TEST-PS-055-09.T13 | a11y | PS-055-04.R03, PS-055-01.R03 | identity document and contact screens with axe-core | zero serious or critical issues; contested warning announced |

## Dependencies

Module depends on: F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
