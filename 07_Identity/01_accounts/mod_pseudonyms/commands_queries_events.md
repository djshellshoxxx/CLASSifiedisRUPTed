# PS-052-04 — Commands, queries and events: Pseudonymous accounts

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M01 Pseudonymous accounts](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/pseudonyms` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-052-04.R01** Account creation, pseudonym change and device key add and revoke are vault commands; add and revoke produce the signed statements classrup.identity.device_link/v1 and classrup.identity.device_revocation/v1, and a change also may produce classrup.identity.handle_claim/v1 for registered relays.
- **PS-052-04.R02** handle claim and release are relay commands that verify the signed statement and update only that relay's registry.
- **PS-052-04.R03** Every command emits its events in the same local transaction as the state change.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `identity.account.create` | identity.account.create | { pseudonym, deviceLabel, signingPublicKey, devicePublicKey, proof: { signingKeySig, deviceKeySig } } | { accountId, did, deviceKeyId, revision: 1 } | VALIDATION_FAILED, IDENTITY_PSEUDONYM_INVALID, IDENTITY_PSEUDONYM_RESERVED, CONFLICT_STATE | identity.account.created, identity.device_key.added | yes (Idempotency-Key) |
| `identity.pseudonym.change` | identity.account.update_pseudonym | { pseudonym, expectedRevision, confirmCooldownOverride?: boolean } | { accountId, revision, pseudonym, skeleton } | VALIDATION_FAILED, IDENTITY_PSEUDONYM_INVALID, IDENTITY_PSEUDONYM_RESERVED, IDENTITY_PSEUDONYM_COOLDOWN, CONFLICT_REVISION | identity.pseudonym.changed | yes (Idempotency-Key) |
| `identity.device_key.add` | identity.device_key.add | { newPublicKey, label, linkStatement: classrup.identity.device_link/v1 (signed), expectedRevision } | { deviceKeyId, revision, statementCid } | VALIDATION_FAILED, IDENTITY_LINK_INVALID, IDENTITY_DEVICE_LIMIT, CONFLICT_REVISION | identity.device_key.added | yes (Idempotency-Key) |
| `identity.device_key.revoke` | identity.device_key.revoke | { deviceKeyId, expectedRevision } | { deviceKeyId, revision, statementCid, revokedAt } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, IDENTITY_LAST_DEVICE_KEY | identity.device_key.revoked | yes (Idempotency-Key) |
| `identity.handle.claim` | identity.handle_registration.claim | { claim: classrup.identity.handle_claim/v1 (signed by the account signing key) } | { registrationId, handle, registeredAt } | VALIDATION_FAILED, IDENTITY_PSEUDONYM_INVALID, IDENTITY_PSEUDONYM_RESERVED, IDENTITY_PSEUDONYM_TAKEN, IDENTITY_PSEUDONYM_CONFUSABLE, IDENTITY_PSEUDONYM_COOLDOWN, RATE_LIMITED |  | yes (Idempotency-Key) |
| `identity.handle.release` | identity.handle_registration.release | { registrationId, release: classrup.identity.handle_release/v1 (signed) } | { registrationId, releasedAt } | NOT_FOUND, CONFLICT_STATE, VALIDATION_FAILED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `identity.pseudonym.check` | identity.account.check_pseudonym | { pseudonym, scope: local\|relay } | { valid, normalized, skeleton, reasons: array, confusableWithContact?: { contactDid, displayPseudonym }, taken?: boolean } | IDENTITY_PSEUDONYM_INVALID, RATE_LIMITED |
| `identity.account.get_own` | identity.account.read_own | { includeDevices?: boolean } | { account: Account, devices?: DeviceKey[] } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `identity.account.created` | P0 | { accountId, did, pseudonym, createdAt } |
| `identity.pseudonym.changed` | P0 | { accountId, did, pseudonym, skeletonVersion, revision } |
| `identity.device_key.added` | P3 | { accountId, deviceKeyId, publicKey, linkedBy } |
| `identity.device_key.revoked` | P3 | { accountId, deviceKeyId, publicKey, revokedAt, statementCid } |

### Events consumed

| Type | Effect |
|---|---|
| `privacy.deletion.completed` | vault erase: delete device keys, keystore handles and the Account, set status erased |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| IDENTITY_PSEUDONYM_INVALID | 422 | no | pseudonym violates length, character, script or format rules |
| IDENTITY_PSEUDONYM_RESERVED | 422 | no | pseudonym skeleton is reserved |
| IDENTITY_PSEUDONYM_TAKEN | 409 | no | skeleton is already held by another DID in this relay's registry |
| IDENTITY_PSEUDONYM_CONFUSABLE | 409 | no | skeleton is confusable with a handle in this relay's registry |
| IDENTITY_PSEUDONYM_COOLDOWN | 429 | no | pseudonym was changed less than 30 days ago |
| IDENTITY_DEVICE_LIMIT | 409 | no | 10 active device keys already exist |
| IDENTITY_LINK_INVALID | 422 | no | device link statement is not signed by an authorized key or is stale |
| IDENTITY_LAST_DEVICE_KEY | 409 | no | revoking would leave no active device key and no verified recovery kit |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command: identity.account.create { "pseudonym": "Riverstone", "deviceLabel": "Pixel 8", "signingPublicKey": "…43 chars…", "devicePublicKey": "…43 chars…", "proof": { … } }
-> { "accountId": "0192f400-…", "did": "did:key:z6Mk…", "deviceKeyId": "0192f401-…", "revision": 1 }
vault command: identity.device_key.add { "newPublicKey": "…", "label": "Laptop", "linkStatement": { "type": "classrup.identity.device_link/v1", … "sig": "…" }, "expectedRevision": 1 }
relay command: identity.handle.claim { "claim": { "type": "classrup.identity.handle_claim/v1", "handle": "Riverstone", "did": "did:key:z6Mk…", "sig": "…" } }
-> 201 { "registrationId": "0192f402-…", "handle": "Riverstone", "registeredAt": "2026-11-04T10:00:00.000Z" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-052-09.T01 | unit | PS-052-01.R01, PS-052-01.R02, PS-052-04.R01 | create account with valid pseudonym | Account stored with did:key (prefix z6Mk), no private key in records, events emitted |
| TEST-PS-052-09.T09 | contract | PS-052-04.R01, PS-052-04.R02, PS-052-04.R03, PS-052-09.R02 | each command and query run | outputs, statements and events validate against registry schemas; statement signatures verify per RFC 8032 |

## Dependencies

Module depends on: CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
