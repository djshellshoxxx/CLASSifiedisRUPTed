# PS-053-04 — Commands, queries and events: Account recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M03 Account recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-053-04.R01** All commands are vault commands; begin, complete and cancel produce signed statements (classrup.identity.recovery_notice/v1 signed by the account key, classrup.identity.recovery_dispute/v1 signed by an existing device key) delivered through the sync outbox.
- **PS-053-04.R02** No command contacts a relay with a secret; statements go to relays and mailboxes only as signed public or end-to-end encrypted items.
- **PS-053-04.R03** Recovery registers and revokes device keys by calling F07.S01.M01, which emits the device key events.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `identity.recovery.create_kit` | identity.recovery_kit.create | { kdf, cipher, encryptedAccountKey, verifierPublicKey, blobChecksum, confirmedWordIndexes: [3 numbers], storedSeparately: true, backupLabel? } | { kitId, revision, supersededKitId? } | VALIDATION_FAILED, IDENTITY_KIT_PARAMS_INVALID, CONFLICT_STATE | identity.recovery.kit_created | yes (Idempotency-Key) |
| `identity.recovery.verify_kit` | identity.recovery_kit.verify | { kitId, words (24), kitFileChecksum } | { kitId, verifiedAt } | NOT_FOUND, IDENTITY_KIT_WORDS_INVALID, IDENTITY_KIT_CORRUPT, RATE_LIMITED |  | yes (Idempotency-Key) |
| `identity.recovery.begin` | identity.recovery_kit.begin | { kitFile, words (24), newDeviceLabel, revokeOthers: boolean } | { kitId, newDeviceKeyId, revokeOthersNotBefore?, noticeStatementCid } | IDENTITY_KIT_WORDS_INVALID, IDENTITY_KIT_CORRUPT, IDENTITY_KIT_PARAMS_INVALID, CONFLICT_STATE, RATE_LIMITED | identity.recovery.requested | yes (Idempotency-Key) |
| `identity.recovery.complete` | identity.recovery_kit.complete | { kitId, expectedRevision } | { kitId, revision, revokedDeviceKeyIds: array, statementCids: array } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, IDENTITY_RECOVERY_WINDOW_OPEN | identity.recovery.completed | yes (Idempotency-Key) |
| `identity.recovery.cancel` | identity.recovery_kit.cancel | { kitId, expectedRevision, reason: user_cancelled\|disputed } | { kitId, revision, disputeStatementCid? } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | identity.recovery.cancelled | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `identity.recovery.get_status` | identity.recovery_kit.read_own | { includeHistory?: boolean } | { kit?: RecoveryKit (without blob), pending?: { requestedAt, revokeOthersNotBefore, newDeviceLabel }, lastVerifiedAt?, verifyDue: boolean } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `identity.recovery.kit_created` | P3 | { accountId, kitId, supersededKitId?, createdAt } |
| `identity.recovery.completed` | P3 | { accountId, kitId, newDeviceKeyId, revokedDeviceKeyIds, completedAt } |
| `identity.recovery.requested` | P3 | { accountId, kitId, newDeviceKeyId, revokeOthersNotBefore?, requestedAt } |
| `identity.recovery.cancelled` | P3 | { accountId, kitId, reason: user_cancelled\|disputed\|expired } |

### Events consumed

| Type | Effect |
|---|---|
| `privacy.deletion.completed` | vault erase - delete all RecoveryKit records; the user's printed kit remains valid and the UI says so |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| IDENTITY_KIT_PARAMS_INVALID | 422 | no | KDF or cipher parameters differ from the required fixed set |
| IDENTITY_KIT_WORDS_INVALID | 422 | no | words are not 24 valid list words or the checksum fails |
| IDENTITY_KIT_CORRUPT | 422 | no | kit file checksum mismatch or authenticated decryption failed |
| IDENTITY_RECOVERY_WINDOW_OPEN | 409 | no | revocation of other devices requested before the 72 hour window ended |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command: identity.recovery.begin { "kitFile": "<bytes>", "words": ["abandon", "…24 words…"], "newDeviceLabel": "New phone", "revokeOthers": true }
-> { "kitId": "0192f420-…", "newDeviceKeyId": "0192f421-…", "revokeOthersNotBefore": "2026-11-07T10:00:00.000Z", "noticeStatementCid": "sha256-Qm…" }
(72 hours later) vault command: identity.recovery.complete { "kitId": "0192f420-…", "expectedRevision": 2 }
-> { "kitId": "0192f420-…", "revision": 3, "revokedDeviceKeyIds": ["0192f401-…"], "statementCids": ["sha256-Zx…"] }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-053-09.T06 | integration | PS-053-03.R02, PS-053-04.R03 | begin then dispute statement from D2 | kit returns to active, contested identity flagged, cancelled event emitted |
| TEST-PS-053-09.T07 | contract | PS-053-04.R01, PS-053-04.R02, PS-053-09.R02 | every command, query and event run | outputs, statements and payloads validate against registry schemas; statement signatures verify |
| TEST-PS-053-09.T08 | integration | PS-053-04.R03, PS-053-06.R02 | begin registers a new device key through F07.S01.M01 | identity.device_key.added emitted by M01 once; revocations emitted on complete |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
