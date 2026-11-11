# PS-055-01 — Domain schema: Portable identity

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M01 Portable identity](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/portable` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-055-01.R01** A PortableIdentityDoc stores the signed document bytes' fields, its cid, sequence, previous cid, status and provenance, for the owner's own versions and for received versions of others.
- **PS-055-01.R02** The signed payload lists the DID, seq, prev, pseudonym, device keys with statuses and possession signatures, hashes of older revoked keys, relays and issuedAt/expiresAt, is signed only by the DID root key, and is at most 8 KiB.
- **PS-055-01.R03** Statuses express verification outcomes - verifying, current, gap_pending, recovery_pending, stale (own, needs reissue), expired, superseded, history and contested - and never imply real-world identity.
- **PS-055-01.R04** The document keeps its root-key seq and prev chain but uses the F11.S01.M03 cid and signed-bytes definition and its shared golden vectors, and each stored version records its earliest evidence time, the first-seen time of every key and the keyrevocation statements verified with it.

## Specification

### PortableIdentityDoc

Schema `classrup.identity.portable_doc/v1` · storage **relay+device** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| did | did — did:key subject, derived from the account root key |
| seq | int — starts at 1, increases by exactly 1 per version of one DID |
| prev? | string — cid of the previous version; absent for seq 1 |
| cid | string — the F11.S01.M03 definition, "sha256-" + base64url(SHA-256(JCS(envelope minus sig and cid))), checked against the shared golden vectors tests/fixtures/federation/envelope-golden.json (CTR-FED-001 FED-7) |
| pseudonym | string — display label claimed by the owner, 3..32 code points |
| deviceKeys | array — at most 20 entries, at most 10 active { publicKey (43 chars), status: active\|revoked, addedAt, linkNonce, possessionSig (active entries), revokedAt?, revokesEffectiveAt?, revokeReason?: lost\|stolen\|retired\|compromised\|recovery\|superseded, recoveryNoticeCid? } |
| revokedKeyHashes | array — at most 64 base64url first-16-byte SHA-256 hashes of keys revoked in the last 180 days that no longer fit in deviceKeys |
| relays | array — at most 5 HTTPS URLs without credentials or query, each at most 255 characters; for own documents exactly the selected relays with listInIdentityDoc true in F11.S03.M01 (ListedRelaysPort) |
| issuedAt | timestamp — the owner's claim |
| expiresAt | timestamp — issuedAt plus 180 days |
| sig | string — Ed25519 signature by the account root key over JCS(envelope minus sig) per F11.S01.M03, so the cid is signed, base64url |
| earliestEvidenceAt | timestamp — local; the verified relay receipt time of this version, else this vault's first receipt; never issuedAt or another claim |
| keyFirstSeen? | array — local; { publicKey, firstSeenAt } the local time this vault first saw each key in a verified version of this DID (not the addedAt claim), used by the F11.S03.M03 key-age rule |
| revocationCids? | array — at most 64 cids of classrup.security.keyrevocation/v1 statements verified with this DID's documents (relay publish or vault intake), kept for N11 linkage reads |
| origin | enum — own \| received \| relay_stored |
| provenance | object — { originRelay?, via: array, receivedAt (local clock), verifiedAt (local clock) } per CTR-FED-001 FED-6 |
| firstSeenAt | timestamp — local clock when this vault first stored any document of this DID (trust on first use) |
| gap | boolean — true when accepted as current while intermediate versions were missing |
| pendingRecoveries? | array — at most 2 { noticeCid, newDevicePublicKey, notBeforeClaim, firstSeenAt (local clock), disputeCids } recorded through recordRecoveryNotice and recordRecoveryDispute |
| revokedUnion? | array — local, not signed, grow-only; { publicKey or keyHash, effectiveRevokedAt (clamped revokesEffectiveAt), clamped: boolean, learnedAt (local clock), removedInSeq?, revocationCid? } for every key ever seen revoked or removed for this DID |
| status | enum — verifying \| current \| gap_pending \| recovery_pending \| stale \| expired \| superseded \| history \| contested |
| contestReason? | enum — fork \| rollback \| two_recoveries \| recovery_disputed \| missing_notice \| early_revocation |
| statementSyncState? | enum — local_committed \| prepared \| transport_acknowledged \| peer_accepted (own documents only) |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- sig verifies against the public key encoded in did over JCS bytes of the document without sig; no device key can sign a document.
- For one DID, seq values are unique among non-contested documents and prev equals the cid of the version seq minus 1 unless the document carries the gap flag.
- Serialized signed document is at most 8 192 bytes.
- At most one document per DID has status current or expired unless the DID is contested.
- revokedUnion never shrinks, and no key in it is treated as active whatever a later document lists.
- effectiveRevokedAt lies between earliestEvidenceAt minus 30 days and earliestEvidenceAt of the first version that revoked the key, and clamped is true whenever the claimed revokesEffectiveAt was moved.

### Storage DDL

```sql
CREATE TABLE identity_portable_doc (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, did TEXT NOT NULL, seq INTEGER NOT NULL, cid TEXT NOT NULL,
  status TEXT NOT NULL, origin TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX identity_portable_doc_cid ON identity_portable_doc(tenant_id, cid);
CREATE INDEX identity_portable_doc_did ON identity_portable_doc(tenant_id, did, seq);
CREATE TABLE identity_doc_key (tenant_id TEXT NOT NULL, public_key TEXT NOT NULL, did TEXT NOT NULL, status TEXT NOT NULL,
  learned_at TEXT NOT NULL, revoked_at TEXT, PRIMARY KEY (tenant_id, public_key, did));
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-055-09.T01 | unit | PS-055-01.R01, PS-055-01.R02, PS-055-02.R01 | issue seq 1 then seq 2 for a fixed account on the root device | statement signed by the root key verifies over JCS bytes, did starts with did:key:z6Mk, cid computed per ID-3, possession signatures present, size under 8 KiB |
| TEST-PS-055-09.T06 | property | PS-055-01.R03, PS-055-03.R01, PS-055-03.R02, PS-055-03.R03, PS-055-09.R03 | random sequences of issue, receive (lower, equal, plus 1, gap, fork, recovery), expiry and device events | only declared transitions succeed; at most one current or expired per uncontested DID; lower seq stored as history; revokedUnion never shrinks; a resolving document that omits any branch revocation never resolves a fork |
| TEST-PS-055-09.T20 | abuse | PS-055-01.R02, PS-055-02.R01 | received document lists an active key without a possession signature, and one whose signature is over another DID | IDENTITY_LINK_INVALID; nothing stored as current |
| TEST-PS-055-09.T27 | contract | PS-055-01.R04, PS-055-01.R02 | shared golden envelopes from tests/fixtures/federation/envelope-golden.json (root-signed) and an issued document; then a document received first through relay X with a verified receipt and later directly | cid and sig byte-equal to the fixtures and to F11.S01.M03 cidOf; earliestEvidenceAt is the relay receipt time, never issuedAt; keyFirstSeen records the local first sighting of D3 and is not changed by a later addedAt claim |

## Dependencies

Module depends on: F07.S01.M01, F11.S01.M03, F16.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
