# PS-090-04 — Commands, queries and events: Account and relay migration

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M03 Account and relay migration](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/migration` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-090-04.R01** The module exposes prepare, copy, announce, cancel and receive commands plus status and redirect queries with the signatures below.
- **PS-090-04.R02** Each command states whether it is vault-local, produces a signed statement or is a relay command, and emits its events in the same transaction.
- **PS-090-04.R03** Only a verified move that became effective on this receiver emits federation.account.moved, and observers act on it only after their own verification.
- **PS-090-04.R04** Move statements and signer roles are registered with F11.S01.M01 (N2): classrup.federation.move/v1 signed by a device key of the subject (relay moves by the pinned relay key) and classrup.federation.move_cancel/v1 signed by a device key of the subject, a veto by a key other than the move signer; both are signed through F11.S01.M02 publish.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `federation.migration.prepare` | federation.migration.prepare | [vault-local command] { kind: account\|relay, toRelay: relayId or baseUrl } | { migrationId, status: prepared, publicRecords, tombstones } | FEDERATION_MOVE_COOLDOWN, FEDERATION_MOVE_TARGET_INVALID, CONFLICT_STATE, FEATURE_DISABLED |  | yes (Idempotency-Key) |
| `federation.migration.copy` | federation.migration.copy | [vault-local command; routes copies through F11.S02.M01 into the F15.S01.M01 sync outbox] { migrationId, expectedRevision } | { migrationId, revision, copyProgress } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, DEPENDENCY_UNAVAILABLE |  | yes (Idempotency-Key) |
| `federation.migration.announce` | federation.migration.announce | [vault-local command; produces signed statement classrup.federation.move/v1 through F11.S01.M02 publish] { migrationId, expectedRevision } | { migrationId, revision, moveCid, effectiveAt } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, PRECONDITION_FAILED, FEDERATION_MOVE_SIGNER_INVALID, FEDERATION_MOVE_COOLDOWN |  | yes (Idempotency-Key) |
| `federation.migration.cancel` | federation.migration.cancel | [vault-local command; produces signed statement classrup.federation.move_cancel/v1 when announced] { migrationId, expectedRevision } | { migrationId, revision, status: cancelled } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FEDERATION_MOVE_VETO_INVALID |  | yes (Idempotency-Key) |
| `federation.migration.receive_move` | federation.migration.receive | [vault-local or relay command; consumes statements classrup.federation.move/v1 and move_cancel/v1 accepted by F11.S01.M02, with the receipt context { firstReceivedAt, source, oldRelayReceipt? }] { statement: Envelope } | { migrationId, status, effectiveAt, conflictId? } | FED_SIGNATURE_INVALID, FEDERATION_MOVE_SIGNER_INVALID, FEDERATION_MOVE_VETO_INVALID, FEDERATION_KEY_MISMATCH, VALIDATION_FAILED | federation.account.moved | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `federation.migration.get` | federation.migration.read | { migrationId? } or current for the principal | { migration: MigrationRecord } | NOT_FOUND |
| `federation.migration.redirect` | federation.migration.read_public | { author: did:key } over GET /fed/v1/moved | { moved: boolean, toRelay?, moveCid?, until? } | RATE_LIMITED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `federation.account.moved` | P0 | { subject, kind, fromRelay, toRelay, moveCid, effectiveAt (this receiver's clock), redirectUntil } |

### Events consumed

| Type | Effect |
|---|---|
| `identity.portable_doc.published` | own: mark the relays-list update step done when the document lists the new relay and the signer key; received: a newly revoked signer key cancels an announced observed move before its effectiveAt, and first sight of a key starts its 24 h key age (V08) |
| `identity.device_key.revoked` | cancel an own announced move signed by the revoked key within its veto window |
| `federation.delivery.failed` | increase copyProgress.failed for the migration's copy entries |
| `federation.conflict.detected` | subjectRef move:<subject>: set conflictId and hold every announced move of that subject; no redirect is activated |
| `federation.conflict.resolved` | subjectRef move:<subject>: drop_all cancels the held moves; superseded keeps only the move named by supersededByCid, which then follows its own window |
| `privacy.deletion.requested` | cancel the open own migration and send tombstones to both relays |
| `privacy.deletion.completed` | pseudonymize the deleted principal's DID in retained own MigrationRecords (RET-EVIDENCE) (N6) |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| FEDERATION_MOVE_SIGNER_INVALID | 403 | no | signer is not a device key active in the subject's portable document at the receiver's time, or the key is younger than 24 h |
| FEDERATION_MOVE_COOLDOWN | 409 | no | the subject moved less than 30 days ago |
| FEDERATION_MOVE_TARGET_INVALID | 422 | no | target relay is not a confirmed active relay or equals the current relay |
| FEDERATION_MOVE_VETO_INVALID | 403 | no | veto not signed by another device key of the subject or outside this receiver's veto window |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
federation.migration.prepare { kind: "account", toRelay: "relay:new.example" }
-> { migrationId: "0192f3f0-...", status: "prepared", publicRecords: 42, tombstones: 3 }
federation.migration.announce { migrationId: "0192f3f0-...", expectedRevision: 2 }
-> { migrationId: "0192f3f0-...", revision: 3, moveCid: "sha256-Mv...", effectiveAt: "2026-11-05T10:00:00.000Z" }
observer: federation.migration.receive_move { statement } (announcedAt claims 2026-11-03T09:00Z, first receipt 2026-11-04T10:00Z) -> { status: "announced", effectiveAt: "2026-11-05T10:00:00.000Z" }
GET /fed/v1/moved?author=did:key:z6Mk...  (after effectiveAt)
-> { "moved": true, "toRelay": "relay:new.example", "moveCid": "sha256-Mv...", "until": "2027-05-04T10:00:00.000Z" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-090-09.T01 | integration | PS-090-01.R01, PS-090-01.R02, PS-090-04.R01 | prepare, copy, announce, wait 24 h | status effective, moveCid verified, account.moved emitted once, did unchanged, statement holds only did, relay ids and times |
| TEST-PS-090-09.T06 | integration | PS-090-03.R02, PS-090-04.R03 | observer R3 receives a move before and after its local effectiveAt | fetch hints and redirect switch only after effective; F11.S01.M02 accepts P's records from R2 both before and after, on signature alone |
| TEST-PS-090-09.T07 | contract | PS-090-04.R01, PS-090-04.R02, PS-090-04.R04, PS-090-09.R02 | each command, query and event | validate against registry schemas including statements move/v1 and move_cancel/v1 and their signer roles |
| TEST-PS-090-09.T14 | integration | PS-090-02.R05, PS-090-04.R03 | relay move signed by the pinned key; relay move signed by a different key delivered by sender relay S with S's request signature | base URL updated on peers for the first; second dropped with FEDERATION_KEY_MISMATCH, counted against S only, and the named relay is not suspended |
| TEST-PS-090-09.T23 | integration | PS-090-04.R04, PS-090-03.R04 | two moves for P with different targets reach V3 | federation.conflict.detect called with statementClass commitment and subjectRef move:P; both held with no redirect; a drop_all resolution cancels both |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S02.M03, F11.S03.M01, F07.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
