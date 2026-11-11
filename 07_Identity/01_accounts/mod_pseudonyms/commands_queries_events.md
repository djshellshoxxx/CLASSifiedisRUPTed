# PS-052-04 — Commands, queries and events: Pseudonymous accounts

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M01 Pseudonymous accounts](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/pseudonyms` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-052-04.R01** Account creation, pseudonym change and device key add and revoke are vault commands; add produces classrup.identity.device_link/v1 signed by the root key and the new key, revoke produces classrup.security.keyrevocation/v1 (statement type owned by F16.S02.M02), and a pseudonym change may produce classrup.identity.handle_claim/v1 signed by a device key for registered relays.
- **PS-052-04.R02** handle claim and release are relay commands that verify the signed statement and update only that relay's registry.
- **PS-052-04.R03** Every command emits its events in the same local transaction as the state change.
- **PS-052-04.R04** identity.device_key.added and identity.device_key.revoked describe only the local principal's own keys and carry its DID; when identity.device_key.receive derives them from a verified statement signed on another device of the principal, the event has actor.kind federated and provenance { signerKey, statementCid } (CTR-EVT-001 EVT-7) so F13.S01.M03 can alert this device; counterparty key changes are published by F07.S02.M01 as identity.portable_doc.published with origin received, which counterparty consumers must use.
- **PS-052-04.R05** The module exposes the port registerRecoveredKey to F07.S01.M03 and the pure function fingerprintOf, and consumes the injected ports RecoveryKitStatusPort, KeyStatusPort, ConsentCheckPort and the F10 registries, whose implementing modules depend on this one.
- **PS-052-04.R06** Every classrup.security.keyrevocation/v1 this module signs is queued, after privacy.consent.check(federation_publish, relayId), together with the reissued portable document to the relays that document lists (identity.portable_doc.publish with revocations), so a host relay can serve the revocation and the keys it removed through the F07.S02.M01 key-linkage reads (N11).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `identity.account.create` | identity.account.create | { pseudonym, deviceLabel, signingPublicKey, devicePublicKey, proof: { signingKeySig, deviceKeySig over classrup-device-link:v1:<did>:<devicePublicKey>:<signupNonce> }, signupNonce } | { accountId, did, fingerprint, deviceKeyId, revision: 1 } | VALIDATION_FAILED, IDENTITY_PSEUDONYM_INVALID, IDENTITY_PSEUDONYM_RESERVED, IDENTITY_LINK_INVALID, CONFLICT_STATE | identity.account.created, identity.device_key.added | yes (Idempotency-Key) |
| `identity.pseudonym.change` | identity.account.update_pseudonym | { pseudonym, expectedRevision, confirmCooldownOverride?: boolean } | { accountId, revision, pseudonym, skeleton } | VALIDATION_FAILED, IDENTITY_PSEUDONYM_INVALID, IDENTITY_PSEUDONYM_RESERVED, IDENTITY_PSEUDONYM_COOLDOWN, CONFLICT_REVISION | identity.pseudonym.changed | yes (Idempotency-Key) |
| `identity.device_key.add` | identity.device_key.add | { newPublicKey, label, linkOffer: { offerNonce, possessionSig by the new key }, expectedRevision } | { deviceKeyId, revision, linkStatement: classrup.identity.device_link/v1 (signed by the root key, carrying possessionSig), statementCid } | VALIDATION_FAILED, IDENTITY_LINK_INVALID, IDENTITY_DEVICE_LIMIT, IDENTITY_ROOT_KEY_REQUIRED, CONFLICT_REVISION, RATE_LIMITED | identity.device_key.added | yes (Idempotency-Key) |
| `identity.device_key.revoke` | identity.device_key.revoke | { deviceKeyId, reason: lost\|stolen\|retired\|compromised\|superseded, expectedRevision } | { deviceKeyId, revision, status: revoked\|revocation_pending\|contested, statementCid, revokedAt? } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, IDENTITY_LAST_DEVICE_KEY, SECURITY_KEY_UNAUTHORIZED | identity.device_key.revoked | yes (Idempotency-Key) |
| `identity.device_key.receive` | identity.device_key.receive | { statement: classrup.identity.device_link/v1 \| classrup.security.keyrevocation/v1 for the own DID signed on another device of the principal, provenance } | { deviceKeyId, status: active\|revocation_pending\|contested\|revoked } | IDENTITY_LINK_INVALID, SECURITY_KEY_UNAUTHORIZED, IDENTITY_DEVICE_LIMIT, VALIDATION_FAILED, RATE_LIMITED | identity.device_key.added, identity.device_key.revoked | yes (Idempotency-Key) |
| `identity.handle.claim` | identity.handle_registration.claim | { claim: classrup.identity.handle_claim/v1 { handle, did, relayId, claimedAt } signed by a device key active in the DID's document } | { registrationId, handle, revision, registeredAt } | VALIDATION_FAILED, UNAUTHENTICATED, EXPIRED, IDENTITY_PSEUDONYM_INVALID, IDENTITY_PSEUDONYM_RESERVED, IDENTITY_PSEUDONYM_TAKEN, IDENTITY_PSEUDONYM_CONFUSABLE, IDENTITY_PSEUDONYM_COOLDOWN, RATE_LIMITED |  | yes (Idempotency-Key) |
| `identity.handle.release` | identity.handle_registration.release | { registrationId, release: classrup.identity.handle_release/v1 { registrationId, revision, relayId, releasedAt } signed by a device key active in the DID's document } | { registrationId, revision, releasedAt } | NOT_FOUND, CONFLICT_STATE, CONFLICT_REVISION, EXPIRED, UNAUTHENTICATED, VALIDATION_FAILED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `identity.pseudonym.check` | identity.account.check_pseudonym | { pseudonym, scope: local\|relay } | { valid, normalized, skeleton, reasons: array of reason codes, taken?: boolean (relay scope), confusableWithContact?: { contactDid, displayPseudonym } (local scope, contacts already known only) } | IDENTITY_PSEUDONYM_INVALID, RATE_LIMITED |
| `identity.account.get_own` | identity.account.read_own | { includeDevices?: boolean } | { account: Account, devices?: DeviceKey[] } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `identity.account.created` | P0 | { accountId, did, pseudonym, origin: created\|recovered, createdAt } |
| `identity.pseudonym.changed` | P0 | { accountId, did, pseudonym, skeletonVersion, revision } |
| `identity.device_key.added` | P3 | { accountId, did, deviceKeyId, publicKey, linkedBy, linkStatementCid?, origin: this_device\|other_device } - own principal only; other_device events have actor.kind federated and provenance { signerKey, statementCid } |
| `identity.device_key.revoked` | P3 | { accountId, did, deviceKeyId, publicKey, revokedAt, revokeReason: lost\|stolen\|retired\|compromised\|recovery\|superseded\|account_deleted, statementCid, origin: this_device\|other_device } - own principal only; other_device events have actor.kind federated and provenance { signerKey, statementCid } |

### Events consumed

| Type | Effect |
|---|---|
| `privacy.deletion.completed` | notification only - the DeletionPort steps already released relay handles (sign), revoked every device key with reason account_deleted (revoke_keys) and destroyed the keys (destroy_keys); remove leftover rows only, never sign, call relays, delete or destroy keys here (N6a) |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| IDENTITY_PSEUDONYM_INVALID | 422 | no | pseudonym violates length, character, script or format rules |
| IDENTITY_PSEUDONYM_RESERVED | 422 | no | pseudonym skeleton is reserved |
| IDENTITY_PSEUDONYM_TAKEN | 409 | no | skeleton is already held by another DID in this relay's registry |
| IDENTITY_PSEUDONYM_CONFUSABLE | 409 | no | skeleton is confusable with a handle in this relay's registry |
| IDENTITY_PSEUDONYM_COOLDOWN | 429 | no | pseudonym was changed less than 30 days ago |
| IDENTITY_DEVICE_LIMIT | 409 | no | 10 active device keys already exist |
| IDENTITY_LINK_INVALID | 422 | no | device link is not signed by the root key, lacks a valid possession signature by the new key, reuses a nonce or is stale |
| IDENTITY_LAST_DEVICE_KEY | 409 | no | revoking would leave no active device key and no verified recovery kit |
| IDENTITY_ROOT_KEY_REQUIRED | 403 | no | the action needs the account root key, held only on the root device or in the recovery kit |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements and signer roles (N2): classrup.identity.device_link/v1 - the root key plus a possession signature by the new key; classrup.security.keyrevocation/v1 (single revocation type, owned by F16.S02.M02; this module adds the identity rules and the reasons lost, stolen, retired, compromised, recovery, superseded and account_deleted, the last one with finalCids) - the revoked key itself or the root key (immediate) or another active device key (pending 7 days), queued with the reissued portable document to the relays it lists; classrup.identity.handle_claim/v1 and classrup.identity.handle_release/v1 - a device key active in the DID's portable document. Ports provided: registerRecoveredKey(accountSeed, newDevicePublicKey, possessionSig, label, verifiedLatestDoc?) for F07.S01.M03 rebuilds the Account from the root seed plus the latest portable document that the caller already verified with F07.S02.M01 (from the kit file, an export or a relay), signs a device_link with linkedBy recovery, marks this vault as the root device and returns IDENTITY_DEVICE_LIMIT at 10 active keys; without a document it can add the key but knows no other keys to revoke. fingerprintOf(publicKey) is a pure function for every module. Injected ports (dependency inversion, wired by the vault composition root because the implementers depend on this module): RecoveryKitStatusPort.hasVerifiedKit() by F07.S01.M03, KeyStatusPort.isActive(did, publicKey, at) by F07.S02.M01, ConsentCheckPort by F10.S01.M01 privacy.consent.check, and the ExportSectionPort, DeletionPort and RetentionPurgePort registries of F10.S01.M03, F10.S01.M04 and F10.S01.M02. DeletionPort steps implemented for F10.S01.M04 (N6a order sign, revoke_keys, pseudonymize, shred, purge, destroy_keys) - sign: signed handle releases for every registered relay; revoke_keys: one classrup.security.keyrevocation/v1 per registered device key with reason account_deleted and finalCids, the cids of the final statements every module signed in the sign step; destroy_keys: the last step of the whole deletion, which destroys every keystore entry including the root key. Events derived by identity.device_key.receive from a statement signed on another device carry actor.kind federated and provenance { signerKey, statementCid }.

### Example

```
vault command: identity.account.create { "pseudonym": "Riverstone", "deviceLabel": "Pixel 8", "signingPublicKey": "…43 chars…", "devicePublicKey": "…43 chars…", "signupNonce": "…22 chars…", "proof": { … } }
-> { "accountId": "0192f400-…", "did": "did:key:z6Mk…", "fingerprint": "7Qx2 9mKp R4tW 8vNe", "deviceKeyId": "0192f401-…", "revision": 1 }
vault command (root device): identity.device_key.add { "newPublicKey": "…", "label": "Laptop", "linkOffer": { "offerNonce": "…", "possessionSig": "…" }, "expectedRevision": 1 }
-> { "deviceKeyId": "0192f403-…", "linkStatement": { "type": "classrup.identity.device_link/v1", "author": "did:key:z6Mk…", … "sig": "…root…" }, "statementCid": "sha256-…" }
relay command: identity.handle.claim { "claim": { "type": "classrup.identity.handle_claim/v1", "author": "did:key:z6Mk…", "ext": { "signerKey": "did:key:z6Mk…device…" }, "payload": { "handle": "Riverstone", "relayId": "relay.example.org", "claimedAt": "2026-11-04T10:00:00.000Z" }, "sig": "…" } }
-> 201 { "registrationId": "0192f402-…", "handle": "Riverstone", "revision": 1, "registeredAt": "2026-11-04T10:00:00.400Z" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-052-09.T01 | unit | PS-052-01.R01, PS-052-01.R04, PS-052-04.R03 | create account with a valid pseudonym on device A1 | Account stored with did:key, rootDevice true and rootKeyRef only on A1, no private key in records; identity.account.created and identity.device_key.added emitted in the same transaction |
| TEST-PS-052-09.T08 | integration | PS-052-03.R02, PS-052-04.R05 | revoke the last device with and without a verified kit (RecoveryKitStatusPort stub); add an 11th device; re-add a revoked key | IDENTITY_LAST_DEVICE_KEY without kit and allowed with kit; IDENTITY_DEVICE_LIMIT; a revoked key never becomes active again |
| TEST-PS-052-09.T09 | contract | PS-052-04.R01, PS-052-04.R02, PS-052-04.R03, PS-052-04.R04 | each command, query and event run | outputs, statements and events validate against registry schemas; device_key events carry the DID; statement signatures verify per RFC 8032 |
| TEST-PS-052-09.T25 | unit | PS-052-04.R05 | registerRecoveredKey with the root seed and a verified latest document, at 10 active keys, and without a document | Account rebuilt with rootDevice true and a recovery device_link; IDENTITY_DEVICE_LIMIT with nothing stored; without a document the key is added and no other key is known for revocation |
| TEST-PS-052-09.T27 | integration | PS-052-04.R06 | A1 revoked on the root device; relays R1 (consented, listed in the document) and R2 (not consented) | the keyrevocation statement is queued with the reissued document to R1 only; on R1 identity.portable_doc.key_set and find_by_key return A1 as revoked with the revocation cid and A1 as a key removed from the document |
| TEST-PS-052-09.T28 | integration | PS-052-04.R04 | on root device A1 the principal links A3 and later revokes it; the vault on linked device A2 receives the device_link and the keyrevocation through identity.device_key.receive | A2 emits identity.device_key.added and identity.device_key.revoked with actor.kind federated, provenance { signerKey, statementCid } and origin other_device; A1's own events carry origin this_device and actor.kind user |
| TEST-PS-052-09.T29 | unit | PS-052-04.R01, PS-052-02.R05 | identity.device_key.revoke with reason superseded for the old key after a device rotation, and a received revocation with reason account_deleted and finalCids | old key revoked with revokeReason superseded and identity.device_key.revoked carries it; the account_deleted revocation is recorded with its finalCids |

## Dependencies

Module depends on: F16.S02.M02, F10.S01.M02, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
