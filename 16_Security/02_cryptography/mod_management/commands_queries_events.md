# PS-129-04 — Commands, queries and events: Key registry and revocation

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M02 Key registry and revocation](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/management` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-129-04.R01** Every command declares whether it is vault-local, a signed statement or a relay command, and the signatures below do so.
- **PS-129-04.R02** Register and revoke emit security.key.registered and security.key.revoked in the same transaction as the record.
- **PS-129-04.R03** The module consumes identity key events locally and peer events on relays to keep records current.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `security.keyrecord.register` | security.keyrecord.register | { statement, signatures[] } | { keyRecordId, keyId, status, revision: 1 } | VALIDATION_FAILED, SECURITY_KEY_UNAUTHORIZED, SECURITY_KEY_LIMIT, CONFLICT_STATE | security.key.registered | yes (Idempotency-Key) |
| `security.keyrecord.revoke` | security.keyrecord.revoke | { keyId, reason, effectiveFrom?, expectedRevision } | { keyRecordId, revision, revocationStatementCid } | NOT_FOUND, SECURITY_KEY_UNAUTHORIZED, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED | security.key.revoked | yes (Idempotency-Key) |
| `security.keyrecord.record_revocation` | security.keyrecord.record_revocation | { revocationStatement, signature, source } | { keyRecordId?, applied: boolean, pending: boolean } | VALIDATION_FAILED, SECURITY_KEY_UNAUTHORIZED, CONFLICT_STATE | security.key.revoked | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `security.keyrecord.get_status` | security.keyrecord.read_status | { keyId, asOfReceiptTime? } | { status, algorithm, purpose, revokedAt?, revocationEffectiveFrom?, freshnessCheckedAt, freshnessAgeMs, freshnessClass: fresh\|stale\|unknown } | NOT_FOUND |
| `security.keyrecord.list_revocations` | security.keyrecord.read_public | { since?, cursor?, limit ≤ 500 } | { items: revocation statements, listHash, listSignature (relay key over classrup/revocation-list/v1), nextCursor? } |  |
| `security.keyrecord.list_own` | security.keyrecord.read_own | { includeRevoked?: boolean } | { items: KeyRecord[] } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `security.key.registered` | P1 | { keyRecordId, keyId, algorithm, purpose, ownerPrincipal, relationship } |
| `security.key.revoked` | P1 | { keyRecordId, keyId, ownerPrincipal, reason, revokedAt, revocationEffectiveFrom, source } |

### Events consumed

| Type | Effect |
|---|---|
| `identity.device_key.added` | register the new device key as own or counterparty key after verifying its linking statement |
| `identity.device_key.revoked` | record the revocation locally and mark the key revoked |
| `federation.peer.added` | register the peer relay transport key as peer_relay with freshness source set to the peer |
| `federation.account.moved` | register the successor key chain and link the old principal key to its successor via the verified move statement |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| SECURITY_KEY_UNAUTHORIZED | 403 | no | the signer is not authorized to register or revoke this key |
| SECURITY_KEY_LIMIT | 409 | no | more than 10 active device keys for one principal on this relay |
| SECURITY_KEY_REVOKED | 422 | no | the key is revoked and cannot be used for this operation |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command security.keyrecord.revoke (local; produces statement)
{ "keyId": "Qm9b…43chars", "reason": "lost", "effectiveFrom": "2026-11-03T18:00:00Z", "expectedRevision": 3 }
-> { "keyRecordId": "0192f420-bbbb-7000-8000-00000000000b", "revision": 4, "revocationStatementCid": "sha256-ff90…" }
query security.keyrecord.get_status { "keyId": "Qm9b…" } (verifier, vault)
-> { "status": "revoked", "revokedAt": "2026-11-04T10:00:00Z", "revocationEffectiveFrom": "2026-11-03T18:00:00Z", "freshnessCheckedAt": "2026-11-04T10:00:00Z", "freshnessAgeMs": 0, "freshnessClass": "fresh" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-129-09.T06 | contract | PS-129-04.R01, PS-129-04.R02, PS-129-09.R02 | commands, queries, events and revocation list | validate against registry schemas; list signature verifies with relay key |
| TEST-PS-129-09.T07 | integration | PS-129-04.R03 | identity.device_key.added and revoked, federation.peer.added delivered twice | one record each; statuses correct |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
