# PS-048-04 — Commands, queries and events: User location settings

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M02 User location settings](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/location` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-048-04.R01** set_home and clear_home are vault-local commands with no statement; grant and revoke are vault commands that produce signed statements delivered through the sync outbox; receive and receive_revoke are the intake of incoming statements.
- **PS-048-04.R02** Every command emits its local event in the same transaction as the state change; statements are produced by the explicit grant and revoke commands only.
- **PS-048-04.R03** The module consumes block, context (meetup, deal, thread), deletion and accepted-record events to end shares, take in statements and erase data.
- **PS-048-04.R04** Incoming grants and revokes are taken in only from records that F11.S01.M02 accepted with signer role sharer, and the recipient vault returns a signed peer acknowledgement, which alone moves the sharer's outbox entry to peer_accepted.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `discovery.location_setting.set_home` | discovery.location_setting.write_own | { cell5?: string, fromGpsOnce?: boolean, publicLevel: L0\|L1\|L2, entryMode, confirmFrequentChange?: boolean, expectedRevision? } | { settingId, revision, publicCell? } | VALIDATION_FAILED, DISCOVERY_PRECISION_FORBIDDEN, DISCOVERY_COORD_INVALID, DISCOVERY_HOME_CHANGE_CONFIRM_REQUIRED, PRECONDITION_FAILED, CONFLICT_REVISION, UNAUTHENTICATED | discovery.location.updated | yes (Idempotency-Key) |
| `discovery.location_setting.clear_home` | discovery.location_setting.write_own | { expectedRevision } | { settingId, revision } | NOT_FOUND, CONFLICT_REVISION, UNAUTHENTICATED | discovery.location.updated | yes (Idempotency-Key) |
| `discovery.location_share.grant` | discovery.location_share.grant | { recipientDid, contextRef?, precision: L3\|L4, ttlMs, source: gps_once\|map_point, cell6?, position? } | { shareId, effectiveExpiresAt, syncState: local_committed, statement: classrup.discovery.location_share/v1 } | VALIDATION_FAILED, BLOCKED_PARTY, DISCOVERY_SHARE_TTL_INVALID, DISCOVERY_SHARE_LIMIT, DISCOVERY_COORD_INVALID, PRECONDITION_FAILED, RATE_LIMITED, UNAUTHENTICATED | discovery.location_share.granted | yes (Idempotency-Key) |
| `discovery.location_share.revoke` | discovery.location_share.revoke | { shareId, expectedRevision } | { shareId, revision, statement: classrup.discovery.location_share_revoke/v1 } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, UNAUTHENTICATED | discovery.location_share.revoked | yes (Idempotency-Key) |
| `discovery.location_share.receive` | discovery.location_share.receive | { recordCid } of a record F11.S01.M02 accepted with type classrup.discovery.location_share/v1; the sealed payload is opened with the recipient device key | { shareId, effectiveExpiresAt, clamped } | DISCOVERY_SHARE_SIGNATURE_INVALID, BLOCKED_PARTY, DISCOVERY_SHARE_TTL_INVALID, DISCOVERY_SHARE_TIME_INVALID, EXPIRED, CONFLICT_STATE, NOT_FOUND | discovery.location_share.granted | yes (Idempotency-Key) |
| `discovery.location_share.receive_revoke` | discovery.location_share.receive | { recordCid } of a record F11.S01.M02 accepted with type classrup.discovery.location_share_revoke/v1 { shareId, sharerDid, recipientDid, revokedAt } | { shareId, outcome: ended\|pending_marker_stored\|already_ended } | DISCOVERY_SHARE_SIGNATURE_INVALID, NOT_FOUND, CONFLICT_STATE | discovery.location_share.revoked | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `discovery.location.get_own` | discovery.location_setting.read_own | { includeHomeCell?: boolean } | { settingId?, publicLevel, publicCell?, homeCell5?, revision? } | UNAUTHENTICATED |
| `discovery.location_share.list` | discovery.location_share.read_own | { direction?: outgoing\|incoming, status?: active\|ended, limit? (1..50) } | { items: LocationShare[] with syncState and remaining time; positions decrypted only for active shares } | UNAUTHENTICATED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `discovery.location.updated` | P1 | { settingId, publicLevel, publicCell? (at most 4 or 5 characters per level, absent at L0, passed assertPublicCell), revision } |
| `discovery.location_share.granted` | P3 | { shareId, direction, counterpartDid, precision, effectiveExpiresAt, contextRef? } |
| `discovery.location_share.revoked` | P3 | { shareId, direction, counterpartDid, reason: revoked\|expired\|blocked\|context_cancelled\|erased } |

### Events consumed

| Type | Effect |
|---|---|
| `federation.record.accepted` | types classrup.discovery.location_share/v1 and classrup.discovery.location_share_revoke/v1 addressed to the principal: run receive or receive_revoke with the recordCid; records from a DID blocked in either direction are dropped silently and quarantined (N7) |
| `identity.block.added` | end active shares with the blocked DID in both directions with reason blocked and drop later incoming statements from it silently |
| `comms.meetup.cancelled` | end active shares whose contextRef is that meetup with reason context_cancelled |
| `commerce.deal.cancelled` | end active shares whose contextRef is { type: deal, id: dealId } with reason context_cancelled |
| `commerce.deal.completed` | end active shares whose contextRef is { type: deal, id: dealId } with reason context_cancelled |
| `comms.thread.archived` | end active shares whose contextRef is { type: thread, id: threadId } with reason context_cancelled |
| `privacy.deletion.requested` | end all active outgoing and incoming shares with reason erased (the deletion sheet states this); LocationSetting is kept until the DeletionPort plan executes, so a cancelled request loses only the ended shares |
| `privacy.deletion.completed` | no evidence is held to pseudonymize; delete the principal's remaining replay markers; LocationSetting was deleted by the DeletionPort plan during execution |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| DISCOVERY_HOME_CHANGE_CONFIRM_REQUIRED | 409 | no | a 4th or later home change within 24 hours needs explicit confirmation; resend with confirmFrequentChange true |
| DISCOVERY_SHARE_TTL_INVALID | 422 | no | share duration is not allowed or exceeds 24 hours |
| DISCOVERY_SHARE_LIMIT | 409 | no | 5 active outgoing shares exist or one is already active for this recipient and context |
| DISCOVERY_SHARE_SIGNATURE_INVALID | 422 | no | incoming share or revoke signature, signer role or addressing is invalid |
| DISCOVERY_SHARE_TIME_INVALID | 422 | no | incoming share claims an issue time more than 10 minutes ahead or an expiry more than 24 h after issue |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statement registry (N2): classrup.discovery.location_share/v1 and classrup.discovery.location_share_revoke/v1 have signer role 'sharer (sharerDid)' and audience 'participants' (exactly the recipient) and are registered in the F11.S01.M01 registry. They are sealed to the recipient's device keys from the F07.S02.M01 portable identity document through the F08.S01.M01 sealed-envelope port (injected by the vault composition), queued in the F11.S02.M01 sync outbox and put into the recipient's mailbox with expiresAt = claimedExpiresAt (at most 24 h). The recipient vault fetches them through F11.S01.M02 federation.record.receive, which verifies signature and signer role and emits federation.record.accepted; only then do receive or receive_revoke run, and the recipient returns a signed peer acknowledgement that is the only way the sharer's entry reaches peer_accepted. set_home and clear_home were published as discovery.location.set_home and discovery.location.clear_home, which remain accepted aliases for one release. Geo codes are owned by F06.S02.M01 (N1).

### Example

```
vault command: discovery.location_setting.set_home { "cell5": "u4pru", "publicLevel": "L1", "entryMode": "map_tile" }
-> { "settingId": "0192f3e0-…", "revision": 1, "publicCell": "u4pr" }
vault command: discovery.location_share.grant { "recipientDid": "did:key:z6Mk…", "contextRef": { "type": "meetup", "id": "0192f3e1-…" }, "precision": "L4", "ttlMs": 7200000, "source": "gps_once" }
-> privacy.consent.check({ purpose: "location_precise" }) granted
-> { "shareId": "0192f3e2-…", "effectiveExpiresAt": "2026-11-04T12:00:00.000Z", "syncState": "local_committed" }
recipient vault: federation.record.accepted { type: "classrup.discovery.location_share_revoke/v1", cid: "sha256-…" } -> discovery.location_share.receive_revoke { "recordCid": "sha256-…" } -> { "shareId": "0192f3e2-…", "outcome": "ended" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-048-09.T05 | contract | PS-048-04.R01, PS-048-04.R02, PS-048-09.R02 | each command and event runs | outputs, statements and event payloads validate against registry schemas; old alias names accepted |
| TEST-PS-048-09.T06 | integration | PS-048-04.R03 | block added, meetup cancelled, deal cancelled, deal completed and thread archived events delivered | affected shares end with reasons blocked and context_cancelled |
| TEST-PS-048-09.T15 | integration | PS-048-04.R04, PS-048-02.R03 | verified revoke for an active incoming share; revoke arriving before its grant; revoke signed by R for Q's share | share ended and per-share key deleted; pending marker stored and the later grant refused with CONFLICT_STATE; DISCOVERY_SHARE_SIGNATURE_INVALID and quarantined |

## Dependencies

Module depends on: F06.S02.M01, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
