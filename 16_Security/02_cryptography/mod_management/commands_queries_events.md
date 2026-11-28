# PS-129-04 — Commands, queries and events: Key registry and revocation

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M02 Key registry and revocation](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/management` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-129-04.R01** Every command declares whether it is vault-local, a signed statement or a relay command, and the signatures below do so.
- **PS-129-04.R02** Register, revoke, record_revocation and the event ingestion emit security.key.registered and security.key.revoked in the same transaction as the record.
- **PS-129-04.R03** The module consumes own-key identity events, received identity documents, peer events and relay identity events to keep records current, and never decides user-key validity itself.
- **PS-129-04.R04** security.keyrecord.get returns publicKey, algorithm and purpose for a keyId, and get_status for a user key is one call to F07.S02.M01 KeyStatusPort.keyStatus(did, publicKey, at) with this module's freshness added; F16.S02.M03 callers pass that result to verify.
- **PS-129-04.R05** Relay revocation lists are a signed head { relayId, listSeq, issuedAt, nextUpdateBy, headHash, entryCount } under classrup/revocation-list/v1 plus entries that point to root-signed identity documents or relay-signed revocations, and a relay's signature is never the authority for a user key.
- **PS-129-04.R06** security.key.registered and security.key.revoked carry keyId, purpose and relationship, so consumers such as F13.S01.M01 match VAPID keys (purpose vapid) and device keys without calling security.keyrecord.get_status.
- **PS-129-04.R07** get_status called with the statementCid of a statement signed by a key revoked with reason account_deleted returns status revoked with finalListed true only when that cid is in the revocation's finalCids, and F16.S02.M03 verify accepts a revoked key only for such a listed statement.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `security.keyrecord.register` | security.keyrecord.register | { purpose: vapid, publicKey, algorithm: ecdsa_p256, notAfter? } | { keyRecordId, keyId, status, revision: 1 } | VALIDATION_FAILED, SECURITY_KEY_UNAUTHORIZED, SECURITY_KEY_LIMIT, CONFLICT_STATE | security.key.registered | yes (Idempotency-Key) |
| `security.keyrecord.revoke` | security.keyrecord.revoke | { keyId, reason, effectiveFrom?, expectedRevision } | { keyRecordId, revision, revocationStatementCid, listSeq } | NOT_FOUND, SECURITY_KEY_UNAUTHORIZED, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED | security.key.revoked | yes (Idempotency-Key) |
| `security.keyrecord.record_revocation` | security.keyrecord.record_revocation | { revocationStatement, signature, source, relayReceipt? } | { keyRecordId?, applied: boolean, inRevokedSet: boolean, refreshHint: boolean, effectiveFromClamped: boolean, finalCidsRecorded: int } | VALIDATION_FAILED, SECURITY_KEY_UNAUTHORIZED, CONFLICT_STATE | security.key.revoked | yes (Idempotency-Key) |
| `security.keyrecord.ingest_list` | security.keyrecord.ingest_list | { relayId, head: classrup/revocation-list/v1 envelope, entries[] (≤ 500 per call), cursor? } | { accepted: boolean, listSeq, replayDetected: boolean, applied: int, refreshHints: int } | VALIDATION_FAILED, SECURITY_REVOCATION_LIST_STALE, SECURITY_SIGNATURE_INVALID | security.key.revoked | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `security.keyrecord.get_status` | security.keyrecord.read_public_status | { keyId } or { did, publicKey }, at? (the statement's first-seen time), statementCid? (the statement being verified), highStakes?: boolean | { status, algorithm, purpose, relationship, authority, revokedAt?, revocationReason?, revocationEffectiveFrom?, effectiveFromClamped, finalListed: boolean (status revoked with reason account_deleted and statementCid in finalCids), freshnessCheckedAt, freshnessIssuedAt, freshnessAgeMs, independentSources, freshnessClass: fresh\|stale\|unknown } | NOT_FOUND |
| `security.keyrecord.get` | security.keyrecord.read_public_status | { keyId } | { keyId, publicKey, algorithm, purpose, ownerPrincipal, relationship, status } | NOT_FOUND |
| `security.keyrecord.list_revocations` | security.keyrecord.read_public | { sinceSeq?, cursor?, limit ≤ 500 } | { head: classrup/revocation-list/v1 envelope { relayId, listSeq, issuedAt, nextUpdateBy, headHash, entryCount }, items: [{ keyHash, did?, docSeq?, docCid?, revocationStatementCid?, reason, revokedAt, effectiveFrom }], nextCursor? } |  |
| `security.keyrecord.list_own` | security.keyrecord.read_own | { includeRevoked?: boolean } | { items: KeyRecord[] } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `security.key.registered` | P1 | { keyRecordId, keyId, publicKey, algorithm, purpose, ownerPrincipal, relationship, authority, docSeq? } |
| `security.key.revoked` | P1 | { keyRecordId, keyId, ownerPrincipal, purpose, relationship, reason, revokedAt, revocationEffectiveFrom, effectiveFromClamped, source } |

### Events consumed

| Type | Effect |
|---|---|
| `identity.device_key.added` | own keys only - cache the local principal's new device key as relationship own from its root-signed device link and emit security.key.registered |
| `identity.device_key.revoked` | own keys only - mark the local principal's key revoked as F07.S01.M01 decided, add its hash to the revoked-key set and emit security.key.revoked |
| `identity.portable_doc.published` | origin received (vault) or relay_stored (relay) - cache addedKeys as counterparty or relay_hosted keys and apply revokedKeys[].revokesEffectiveAt as revocations clamped per V04, record docSeq, docCid and the providing relay as a freshness source; status contested marks the DID's keys contested; origin own is ignored |
| `federation.peer.added` | read the pinned relay key through PeerKeyPort.resolveKey(peerId) and record it as peer_relay with freshness source the peer |
| `federation.peer.removed` | move the peer's key record to expired so it is no longer trusted for new statements |
| `platform.relay_identity.rotated` | mirror this relay's transport key history - a rotation records the new key as relay_owned relay_transport and expires the retired key at the rotation time; a revocation revokes the key with the given reason |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| SECURITY_KEY_UNAUTHORIZED | 403 | no | the signer is not authorized to register or revoke this key |
| SECURITY_KEY_LIMIT | 409 | no | more than 10 active device keys for one principal or 20 relay-owned keys on this relay |
| SECURITY_REVOCATION_LIST_STALE | 409 | no | the revocation list head is older than or replays the one already stored for that relay |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements (N2): classrup.security.keyrevocation/v1 (owned here; the single revocation type for device keys, F07.S01.M01 produces it with its identity rules) { keyId, publicKey, ownerPrincipal, reason: lost|stolen|retired|compromised|recovery|superseded|account_deleted (device keys) or retired|compromised|administrative (relay_owned keys), effectiveFrom?, revokedByKey, finalCids? (account_deleted only, at most 120 cids of the final statements signed in the F10.S01.M04 DeletionPort sign step) } signed by the revoked key itself or the account root key (immediate; the recovery-key role is the F07 account root key, from the root device or the recovery kit, with no separate recovery key in MVP), another active device key (pending 7 days unless the root key confirms; mutual revocations contested), or for relay_owned keys the relay key, registered in F11.S01.M01 with those signer roles; the revocation list head is an F16.S02.M03 envelope with context classrup/revocation-list/v1 signed by the relay key. Injected ports (wired by the composition roots because the implementers depend on this module): KeyStatusPort.keyStatus and IdentityRefreshPort.refresh(did, relays) of F07.S02.M01, PeerKeyPort.resolveKey(peerId) of F11.S03.M01 (read on federation.peer.added and at most 60 s cached on verification, so pinned-key rotations are picked up). Privacy duties (N6, N6a): fields carry F10.S02.M02 classification annotations; the vault registers ExportSectionPort (security.keys), DeletionPort (the vault erase step removes KeyRecords and the local revoked-key set; relay-native records are untouched) and RetentionPurgePort (RET-EVIDENCE purge that never touches the revoked-key set) with the F10.S01.M03, F10.S01.M04 and F10.S01.M02 registries injected by the composition root.

### Example

```
relay command security.keyrecord.revoke (relay_operator; produces statement signed by the relay key)
{ "keyId": "Qm9b…43chars", "reason": "compromised", "expectedRevision": 3 }
-> { "keyRecordId": "0192f420-bbbb-7000-8000-00000000000b", "revision": 4, "revocationStatementCid": "sha256-ff90…", "listSeq": 812 }
vault query security.keyrecord.get_status { "did": "did:key:z6MkQ…", "publicKey": "…", "at": "2026-11-04T09:55:00Z", "highStakes": true }
-> calls KeyStatusPort.keyStatus(did, publicKey, at) once
-> { "status": "active", "relationship": "counterparty", "authority": "f07_identity", "freshnessIssuedAt": "2026-11-04T07:00:00Z", "freshnessAgeMs": 10500000, "independentSources": 2, "freshnessClass": "fresh" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-129-09.T01 | unit | PS-129-01.R01, PS-129-01.R02, PS-129-01.R04, PS-129-04.R02 | identity.portable_doc.published (received) adding Kq for Q; identity.device_key.added for own K2 | counterparty and own KeyRecords stored active with authority f07_identity, keyId equals thumbprint, security.key.registered carries publicKey |
| TEST-PS-129-09.T06 | contract | PS-129-04.R01, PS-129-04.R05, PS-129-09.R03 | commands, queries, events and the revocation list head | validate against registry schemas; the head verifies with the relay key under classrup/revocation-list/v1 and its entries reference identity documents |
| TEST-PS-129-09.T07 | integration | PS-129-04.R03 | identity.device_key.added and revoked, identity.portable_doc.published received twice, federation.peer.added and removed, platform.relay_identity.rotated | one record each; statuses correct; peer key read through PeerKeyPort; retired relay key expired at the rotation time |
| TEST-PS-129-09.T16 | integration | PS-129-04.R04, PS-129-01.R05 | get for a keyId; get_status for a user key; lookup of an agreement key | publicKey, algorithm and purpose returned; KeyStatusPort called exactly once with (did, publicKey, at) and freshness added; no agreement record exists |
| TEST-PS-129-09.T19 | integration | PS-129-01.R06, PS-129-04.R07 | relay records P's account_deleted revocation of K1 listing cids c1 and c2 through record_revocation, then receives statements c1 and c3 signed by K1; get_status with statementCid c1 and c3; F07 later reports K1 revoked by the root key for compromise | c1 finalListed true and accepted by F16.S02.M03 verify; c3 finalListed false and refused with SECURITY_KEY_REVOKED; after the compromise report c1 finalListed false |
| TEST-PS-129-09.T21 | contract | PS-129-04.R06 | security.key.revoked for a VAPID key and for a device key; a consumer stub that matches on purpose | both payloads carry keyId, purpose and relationship; the stub expires the VAPID subscriptions without a get_status call |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M03, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
