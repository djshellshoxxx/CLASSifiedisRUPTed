# PS-048-04 — Commands, queries and events: User location settings

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M02 User location settings](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/location` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-048-04.R01** set_home and clear_home are vault-local commands with no statement; grant and revoke are vault commands that produce signed statements delivered through the sync outbox; receive is the intake of an incoming statement.
- **PS-048-04.R02** Every command emits its local event in the same transaction as the state change; statements are produced by the explicit grant and revoke commands only.
- **PS-048-04.R03** The module consumes block, meetup-cancel and deletion events to end shares and erase data.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `discovery.location.set_home` | discovery.location_setting.write_own | { cell5?: string, fromGpsOnce?: boolean, publicLevel: L0\|L1\|L2, entryMode, expectedRevision? } | { settingId, revision, publicCell? } | VALIDATION_FAILED, DISCOVERY_PRECISION_FORBIDDEN, DISCOVERY_COORD_INVALID, DISCOVERY_HOME_CHANGE_LIMIT, CONFLICT_REVISION | discovery.location.updated | yes (Idempotency-Key) |
| `discovery.location.clear_home` | discovery.location_setting.write_own | { expectedRevision } | { settingId, revision } | NOT_FOUND, CONFLICT_REVISION | discovery.location.updated | yes (Idempotency-Key) |
| `discovery.location_share.grant` | discovery.location_share.grant | { recipientDid, contextRef?, precision: L3\|L4, ttlMs, source: gps_once\|map_point, cell6?, position? } | { shareId, effectiveExpiresAt, syncState: local_committed, statement: classrup.discovery.location_share/v1 } | VALIDATION_FAILED, BLOCKED_PARTY, DISCOVERY_SHARE_TTL_INVALID, DISCOVERY_SHARE_LIMIT, DISCOVERY_COORD_INVALID, RATE_LIMITED | discovery.location_share.granted | yes (Idempotency-Key) |
| `discovery.location_share.revoke` | discovery.location_share.revoke | { shareId, expectedRevision } | { shareId, revision, statement: classrup.discovery.location_share_revoke/v1 } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | discovery.location_share.revoked | yes (Idempotency-Key) |
| `discovery.location_share.receive` | discovery.location_share.receive | { envelope: classrup.discovery.location_share/v1 (decrypted), provenance } | { shareId, effectiveExpiresAt, clamped } | DISCOVERY_SHARE_SIGNATURE_INVALID, BLOCKED_PARTY, DISCOVERY_SHARE_TTL_INVALID, CONFLICT_STATE | discovery.location_share.granted | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `discovery.location.get_own` | discovery.location_setting.read_own | { includeHomeCell?: boolean } | { settingId?, publicLevel, publicCell?, homeCell5?, revision? } |  |
| `discovery.location_share.list` | discovery.location_share.read_own | { direction?: outgoing\|incoming, status?: active\|ended, limit? (1..50) } | { items: LocationShare[] with syncState and remaining time } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `discovery.location.updated` | P1 | { settingId, publicLevel, publicCell? (at most 4 or 5 characters per level, absent at L0), revision } |
| `discovery.location_share.granted` | P3 | { shareId, direction, counterpartDid, precision, effectiveExpiresAt, contextRef? } |
| `discovery.location_share.revoked` | P3 | { shareId, direction, counterpartDid, reason: revoked\|expired\|blocked\|context_cancelled\|erased } |

### Events consumed

| Type | Effect |
|---|---|
| `identity.block.added` | end active shares with the blocked DID in both directions with reason blocked and drop later incoming statements from it silently |
| `comms.meetup.cancelled` | end active shares whose contextRef is that meetup with reason context_cancelled |
| `privacy.deletion.requested` | end all shares and delete LocationSetting and share records in the same transaction |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| DISCOVERY_PRECISION_FORBIDDEN | 422 | no | cell finer than L2 offered for storage as public level |
| DISCOVERY_COORD_INVALID | 422 | no | latitude or longitude is not a finite in-range value |
| DISCOVERY_HOME_CHANGE_LIMIT | 429 | no | home region was changed 3 times in 24 hours |
| DISCOVERY_SHARE_TTL_INVALID | 422 | no | share duration is not allowed or exceeds 24 hours |
| DISCOVERY_SHARE_LIMIT | 409 | no | 5 active outgoing shares exist or one is already active for this recipient and context |
| DISCOVERY_SHARE_SIGNATURE_INVALID | 422 | no | incoming share signature or addressing is invalid |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command: discovery.location.set_home { "cell5": "u4pru", "publicLevel": "L1", "entryMode": "map_tile" }
-> { "settingId": "0192f3e0-…", "revision": 1, "publicCell": "u4pr" }
vault command: discovery.location_share.grant { "recipientDid": "did:key:z6Mk…", "contextRef": { "type": "meetup", "id": "0192f3e1-…" }, "precision": "L4", "ttlMs": 7200000, "source": "gps_once" }
-> { "shareId": "0192f3e2-…", "effectiveExpiresAt": "2026-11-04T12:00:00.000Z", "syncState": "local_committed" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-048-09.T05 | contract | PS-048-04.R01, PS-048-04.R02, PS-048-09.R02 | each command and event runs | outputs, statements and event payloads validate against registry schemas |
| TEST-PS-048-09.T06 | integration | PS-048-04.R03 | block added and meetup cancelled events delivered | affected shares end with reasons blocked and context_cancelled |

## Dependencies

Module depends on: F06.S02.M01, F07.S01.M01, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
