# PS-090-04 — Commands, queries and events: Account and relay migration

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M03 Account and relay migration](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/migration` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-090-04.R01** The module exposes prepare, copy, announce, cancel and receive commands plus status and redirect queries with the signatures below.
- **PS-090-04.R02** Each command states whether it is vault-local, produces a signed statement or is a relay command, and emits its events in the same transaction.
- **PS-090-04.R03** Only a verified, effective move emits federation.account.moved, and observers act on it only after their own verification.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `federation.migration.prepare` | federation.migration.prepare | [vault-local command] { kind: account\|relay, toRelay: relayId or baseUrl } | { migrationId, status: prepared, publicRecords, tombstones } | FEDERATION_MOVE_COOLDOWN, FEDERATION_MOVE_TARGET_INVALID, CONFLICT_STATE, FEATURE_DISABLED |  | yes (Idempotency-Key) |
| `federation.migration.copy` | federation.migration.copy | [vault-local command; uses sync outbox of F11.S02.M01] { migrationId, expectedRevision } | { migrationId, revision, copyProgress } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, DEPENDENCY_UNAVAILABLE |  | yes (Idempotency-Key) |
| `federation.migration.announce` | federation.migration.announce | [vault-local command; produces signed statement classrup.federation.move/v1] { migrationId, expectedRevision } | { migrationId, revision, moveCid, effectiveAt } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, PRECONDITION_FAILED, FEDERATION_MOVE_SIGNER_INVALID, FEDERATION_MOVE_COOLDOWN |  | yes (Idempotency-Key) |
| `federation.migration.cancel` | federation.migration.cancel | [vault-local command; produces signed statement classrup.federation.move_cancel/v1 when announced] { migrationId, expectedRevision } | { migrationId, revision, status: cancelled } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FEDERATION_MOVE_VETO_INVALID |  | yes (Idempotency-Key) |
| `federation.migration.receive_move` | federation.migration.receive | [vault-local or relay command; consumes statements classrup.federation.move/v1, move_cancel/v1] { statement: Envelope } | { migrationId, status, effectiveAt } | FED_SIGNATURE_INVALID, FEDERATION_MOVE_SIGNER_INVALID, FEDERATION_MOVE_VETO_INVALID, FEDERATION_KEY_MISMATCH, VALIDATION_FAILED | federation.account.moved | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `federation.migration.get` | federation.migration.read | { migrationId? } or current for the principal | { migration: MigrationRecord } | NOT_FOUND |
| `federation.migration.redirect` | federation.migration.read_public | { author: did:key } over GET /fed/v1/moved | { moved: boolean, toRelay?, moveCid?, until? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `federation.account.moved` | P0 | { subject, kind, fromRelay, toRelay, moveCid, effectiveAt, redirectUntil } |

### Events consumed

| Type | Effect |
|---|---|
| `identity.portable_doc.published` | mark the home-relay update step done when the document lists the new relay and the signer key |
| `identity.device_key.revoked` | cancel an announced move signed by the revoked key within its veto window |
| `federation.delivery.failed` | increase copyProgress.failed for the migration's copy entries |
| `federation.conflict.detected` | hold the redirect of an observed move whose author has two conflicting move statements |
| `privacy.deletion.requested` | cancel the open own migration and send tombstones to both relays |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| FEDERATION_MOVE_SIGNER_INVALID | 403 | no | signer is not a registered device key of the subject at the signing time |
| FEDERATION_MOVE_COOLDOWN | 409 | no | the subject moved less than 30 days ago |
| FEDERATION_MOVE_TARGET_INVALID | 422 | no | target relay is not a confirmed active relay or equals the current relay |
| FEDERATION_MOVE_VETO_INVALID | 403 | no | veto not signed by another registered device key or outside the veto window |
| FED_SIGNATURE_INVALID | 400 | no | move statement signature check failed |
| FEDERATION_KEY_MISMATCH | 409 | no | relay move not signed by the pinned relay key |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
federation.migration.prepare { kind: "account", toRelay: "relay:new.example" }
-> { migrationId: "0192f3f0-...", status: "prepared", publicRecords: 42, tombstones: 3 }
federation.migration.announce { migrationId: "0192f3f0-...", expectedRevision: 2 }
-> { migrationId: "0192f3f0-...", revision: 3, moveCid: "sha256-Mv...", effectiveAt: "2026-11-05T10:00:00.000Z" }
GET /fed/v1/moved?author=did:key:z6Mk...  (after effectiveAt)
-> { "moved": true, "toRelay": "relay:new.example", "moveCid": "sha256-Mv...", "until": "2027-05-04T10:00:00.000Z" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-090-09.T01 | integration | PS-090-01.R01, PS-090-01.R02, PS-090-04.R01 | prepare, copy, announce, wait 24 h | status effective, moveCid verified, account.moved emitted once, did unchanged |
| TEST-PS-090-09.T06 | integration | PS-090-03.R02, PS-090-04.R03 | observer R3 receives move before and after effectiveAt | rebinding of origin relay only after effective; F11.S01.M02 accepts records from R2 afterward |
| TEST-PS-090-09.T07 | contract | PS-090-04.R01, PS-090-04.R02, PS-090-09.R02 | each command, query and event | validate against registry schemas including statements move/v1 and move_cancel/v1 |
| TEST-PS-090-09.T14 | integration | PS-090-04.R03, PS-090-07.R03 | relay move signed by pinned key, and by a different key | base URL updated on peers for the first; second FEDERATION_KEY_MISMATCH and peer suspended |

## Dependencies

Module depends on: F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S03.M01, F07.S02.M01, F10.S01.M04, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
