# PS-053-04 — Commands, queries and events: Account recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M03 Account recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-053-04.R01** All commands are vault commands; begin produces classrup.identity.recovery_notice/v1 signed by the root key decrypted from the kit, dispute produces classrup.identity.recovery_dispute/v1 signed by an existing device key active in the latest document, and receive_notice and receive_dispute are the intakes of those statements; statements travel through the sync outbox.
- **PS-053-04.R02** No command contacts a relay with a secret; statements go to relays and mailboxes only as signed public or end-to-end encrypted items.
- **PS-053-04.R03** Recovery registers the new device key through the F07.S01.M01 port registerRecoveredKey, issues identity documents through F07.S02.M01 and revokes device keys through F07.S01.M01, which emit the device key events.
- **PS-053-04.R04** Begin obtains and verifies the latest identity document before planning any revocation, or runs in the explicit device_list_unknown mode that can add a key but never revokes others.
- **PS-053-04.R05** create_kit signs classrup.identity.recovery_kit_notice/v1 { did, kitId, supersededKitId?, createdAtClaim } with this device key and sends it end-to-end encrypted only to the principal's own devices; receive_kit_notice on another device verifies it, records a kit_observed entry and emits identity.recovery.kit_created with actor.kind federated and provenance { signerKey, statementCid }, so F13.S01.M03 alerts that device; the notice carries no kit material, words or blob.
- **PS-053-04.R06** begin accepts the kit as the file from a file chooser or as the QR code of the printed sheet, both carrying the same kit core checked against blobChecksum, and the words as a pasted whole phrase or per-word entry, and no input path blocks paste or password-manager autofill (CTR-UX-001 UX-5).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `identity.recovery.create_kit` | identity.recovery_kit.create | { kdf, cipher, encryptedAccountKey, verifierPublicKey, blobChecksum, docHint, confirmedWordIndexes: [3 numbers], storedSeparately: true, backupLabel? } | { kitId, revision, supersededKitId?, kitNoticeCid, printSheet: { words layout, qrCore } } | VALIDATION_FAILED, IDENTITY_KIT_PARAMS_INVALID, CONFLICT_STATE | identity.recovery.kit_created | yes (Idempotency-Key) |
| `identity.recovery.verify_kit` | identity.recovery_kit.verify | { kitId, words (24), kitFileChecksum } | { kitId, verifiedAt } | NOT_FOUND, IDENTITY_KIT_WORDS_INVALID, IDENTITY_KIT_CORRUPT, RATE_LIMITED |  | yes (Idempotency-Key) |
| `identity.recovery.begin` | identity.recovery_kit.begin | { kitFile (file chooser) \| kitQr (scanned kit core of the printed sheet), words (24, typed or pasted as one phrase), newDevicePublicKey, possessionSig, newDeviceLabel, revokeOthers: boolean, latestDoc?: classrup.identity.portable_doc/v1, allowUnknownDeviceList?: boolean } | { kitId, newDeviceKeyId, mode: full\|device_list_unknown, latestDocSeq?, revokeOthersNotBefore?, noticeStatementCid } | IDENTITY_KIT_WORDS_INVALID, IDENTITY_KIT_CORRUPT, IDENTITY_KIT_PARAMS_INVALID, IDENTITY_DEVICE_LIMIT, DEPENDENCY_UNAVAILABLE, CONFLICT_STATE, RATE_LIMITED | identity.recovery.requested | yes (Idempotency-Key) |
| `identity.recovery.complete` | identity.recovery_kit.complete | { kitId, expectedRevision } | { kitId, revision, revokedDeviceKeyIds: array, statementCids: array, contested: boolean } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, IDENTITY_RECOVERY_WINDOW_OPEN, DEPENDENCY_UNAVAILABLE | identity.recovery.completed | yes (Idempotency-Key) |
| `identity.recovery.cancel` | identity.recovery_kit.cancel | { kitId, expectedRevision } | { kitId, revision, keptDeviceKeyId } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | identity.recovery.cancelled | yes (Idempotency-Key) |
| `identity.recovery.receive_notice` | identity.recovery_kit.receive_notice | { statement: classrup.identity.recovery_notice/v1, provenance } | { did, noticeCid, status: recorded\|observed\|quarantined, firstSeenAt } | IDENTITY_RECOVERY_STATEMENT_INVALID, VALIDATION_FAILED, RATE_LIMITED | identity.recovery.requested | yes (Idempotency-Key) |
| `identity.recovery.dispute` | identity.recovery_kit.dispute | { noticeCid, reason?: not_me\|lost_device_found } | { noticeCid, disputeCid, syncState: local_committed } | NOT_FOUND, CONFLICT_STATE, RATE_LIMITED |  | yes (Idempotency-Key) |
| `identity.recovery.acknowledge` | identity.recovery_kit.acknowledge | { noticeCid } | { noticeCid, status: accepted } | NOT_FOUND, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `identity.recovery.receive_kit_notice` | identity.recovery_kit.receive_kit_notice | { statement: classrup.identity.recovery_kit_notice/v1 for the own DID, provenance } | { did, kitId, status: recorded\|quarantined, firstSeenAt } | IDENTITY_RECOVERY_STATEMENT_INVALID, VALIDATION_FAILED, RATE_LIMITED | identity.recovery.kit_created | yes (Idempotency-Key) |
| `identity.recovery.receive_dispute` | identity.recovery_kit.receive_dispute | { statement: classrup.identity.recovery_dispute/v1, provenance } | { did, disputeCid, effect: kit_contested\|did_contested\|quarantined } | IDENTITY_RECOVERY_STATEMENT_INVALID, VALIDATION_FAILED, RATE_LIMITED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `identity.recovery.get_status` | identity.recovery_kit.read_own | { includeHistory?: boolean } | { kit?: RecoveryKit (without blob), pending?: { requestedAt, revokeOthersNotBefore, newDeviceLabel, mode, contested }, observed?: [{ noticeCid, firstSeenAt, status }], lastVerifiedAt?, verifyDue: boolean } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `identity.recovery.kit_created` | P3 | { accountId, did, kitId, supersededKitId?, createdAt, origin: this_device\|other_device } - other_device events have actor.kind federated and provenance { signerKey, statementCid } |
| `identity.recovery.completed` | P3 | { accountId, did, kitId, newDeviceKeyId, revokedDeviceKeyIds, contested, completedAt } |
| `identity.recovery.requested` | P3 | { accountId, did, kitId?, newDevicePublicKey, noticeCid, revokeOthersNotBefore?, requestedAt, origin: own\|observed } |
| `identity.recovery.cancelled` | P3 | { accountId, did, kitId, keptDeviceKeyId, reason: user_cancelled\|expired } |

### Events consumed

| Type | Effect |
|---|---|
| `identity.portable_doc.published` | own DID, origin received or relay_stored - when F07.S02.M01 applied a document completing a recovery after its 72 h wait, move the matching observed record from received to accepted |
| `privacy.deletion.completed` | final cleanup only - the DeletionPort steps already deleted kit metadata and pseudonymized observed notices and disputes kept as evidence; the user's printed kit remains valid and the UI says so |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| IDENTITY_KIT_PARAMS_INVALID | 422 | no | KDF or cipher parameters differ from the required fixed set |
| IDENTITY_KIT_WORDS_INVALID | 422 | no | words are not 24 valid list words or the checksum fails |
| IDENTITY_KIT_CORRUPT | 422 | no | kit file checksum mismatch or authenticated decryption failed |
| IDENTITY_RECOVERY_WINDOW_OPEN | 409 | no | revocation of other devices requested before the 72 hour (or, when contested, 7 day) window ended |
| IDENTITY_RECOVERY_STATEMENT_INVALID | 422 | no | a recovery notice or dispute does not verify against the DID root key or an active device key of the latest document |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements and signer roles (N2): classrup.identity.recovery_notice/v1 { did, newDevicePublicKey, plannedRevocations, notBeforeClaim, docCid } - the DID root key decrypted from the kit; classrup.identity.recovery_dispute/v1 { did, noticeCid, reason } - a device key active in the latest document the receiver holds, never the new key; classrup.identity.recovery_kit_notice/v1 { did, kitId, supersededKitId?, createdAtClaim } - the device key of the creating (root) device, sent end-to-end encrypted to the principal's own device mailboxes only, never to a relay index. Events derived from another device's notice carry actor.kind federated and provenance { signerKey, statementCid }. Incoming disputes - in the recovering vault a verified dispute moves the kit to contested (complete allowed after 7 days); in every other vault receive_dispute calls the F07.S02.M01 port recordRecoveryDispute and the DID shows as contested until the viewer resolves it. Incoming notices - receive_notice calls F07.S02.M01 recordRecoveryNotice for any DID so the receiver's own 72 h wait starts at its first sight, and for the own DID on an existing device also creates an observed record and the banner. Notices and disputes are sent to relays only after privacy.consent.check(federation_publish, relayId); without consent they go only to the own devices' mailboxes or as a file or QR. This module implements RecoveryKitStatusPort.hasVerifiedKit() for F07.S01.M01.

### Example

```
vault command: identity.recovery.begin { "kitFile": "<bytes>", "words": ["abandon", "…24 words…"], "newDevicePublicKey": "…", "possessionSig": "…", "newDeviceLabel": "New phone", "revokeOthers": true }
-> latest document fetched from the relays in the kit's docHint and verified (seq 7)
-> { "kitId": "0192f420-…", "newDeviceKeyId": "0192f421-…", "mode": "full", "latestDocSeq": 7, "revokeOthersNotBefore": "2026-11-07T10:00:00.000Z", "noticeStatementCid": "sha256-Qm…" }
(72 hours later, no dispute) vault command: identity.recovery.complete { "kitId": "0192f420-…", "expectedRevision": 2 }
-> { "kitId": "0192f420-…", "revision": 3, "revokedDeviceKeyIds": ["0192f401-…"], "statementCids": ["sha256-Zx…"], "contested": false }
peer vault that first saw the notice at 2026-11-04T20:00Z applies the revocation only from 2026-11-07T20:00Z
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-053-09.T07 | contract | PS-053-04.R01, PS-053-09.R02 | every command, query and event run | outputs, statements and payloads validate against registry schemas; notice signed by the root key and dispute by a device key verify |
| TEST-PS-053-09.T08 | integration | PS-053-04.R03, PS-053-06.R02 | begin registers the new key through registerRecoveredKey; then begin with 10 active keys | identity.device_key.added emitted once by F07.S01.M01; revocations emitted on complete; IDENTITY_DEVICE_LIMIT with nothing stored; outbox states shown honestly |
| TEST-PS-053-09.T11 | abuse | PS-053-04.R02, PS-053-07.R01, PS-053-07.R02, PS-053-09.R03 | inspect storage, events, logs, exports and network traces during create and begin | words and derived keys appear nowhere; no kit upload without the user's choice; relays receive only signed public or encrypted items |
| TEST-PS-053-09.T18 | integration | PS-053-04.R04 | offline begin in an empty vault without a latest document and revokeOthers true, then with device_list_unknown, then reconnect | DEPENDENCY_UNAVAILABLE first; unknown mode adds the key and plans no revocation; after reconnect the fetched document is verified and a seq collision is reported as a fork |
| TEST-PS-053-09.T26 | integration | PS-053-04.R05 | create_kit on root device D1; device D2 receives the notice; a forged notice signed by revoked key D3; the same notice twice | D2 records kit_observed and emits identity.recovery.kit_created with actor.kind federated, provenance { signerKey, statementCid } and origin other_device; D1's event has origin this_device; D3's notice IDENTITY_RECOVERY_STATEMENT_INVALID; the duplicate is a no-op; no notice contains words, blob or verifier |
| TEST-PS-053-09.T27 | e2e | PS-053-04.R06, PS-053-02.R03 | begin with the kit QR scanned from the printed sheet, with the kit file, with the whole phrase pasted into the first field, and with a QR core that has one changed byte | QR and file give the same kit core and recover; the pasted phrase fills all 24 fields; the changed core IDENTITY_KIT_CORRUPT |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
