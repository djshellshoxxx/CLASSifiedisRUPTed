# PS-106-04 — Commands, queries and events: In-app notification preferences

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M04 In-app notification preferences](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/in` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-106-04.R01** Matrix changes and reset are vault commands, check is a vault in-process query for every channel, the mirror is a relay command accepting a signed per-channel statement, and resolve is a relay internal query for hook dispatches.
- **PS-106-04.R02** Each vault command emits vault-local notify.preference.changed in the same IndexedDB transaction as the change, and the relay mirror emits relay-local notify.preference.changed in the same SQLite transaction when the effective cells change.
- **PS-106-04.R03** The vault instance consumes vault-local channel consent events to show channel status and to mirror a newly consented channel, and the relay instance consumes relay-local notify.channel.opted_out and security.key.revoked to delete or retire its mirror rows.
- **PS-106-04.R04** classrup.notify.preference_mirror/v1 is registered with F11.S01.M01 (N2) with signer role principal and audience the relay named in payload relayId, one statement per channel with its own chain stream.
- **PS-106-04.R05** The module registers ExportSectionPort (section notify.preferences), DeletionPort (purge step) and RetentionPurgePort (kind notify.preference) with F10 (N6), classifies every field with F10.S02.M02, and routes limits through RateLimitPort of F12.S03.M03 (N18).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `notify.preference.set` | notify.preference.set | [vault command; produces classrup.notify.preference_mirror/v1 for each changed channel consented at a relay] { cells: [{ category, inApp?, push?, email?, expectedRevision }] (≤ 24) } | { cells: NotificationPreference[], mirrorStates: [{ relayId, channel, syncState }] } | VALIDATION_FAILED, NOTIFY_PREF_LOCKED, CONFLICT_REVISION, RATE_LIMITED | notify.preference.changed | yes (Idempotency-Key) |
| `notify.preference.reset` | notify.preference.set | [vault command; produces signed per-channel mirror statements for consented channels] { confirm: true } | { cells: NotificationPreference[], defaultsVersion } | VALIDATION_FAILED, RATE_LIMITED | notify.preference.changed | yes (Idempotency-Key) |
| `notify.preference.mirror` | notify.preference.mirror | [relay command; request signed by an active device key of userDid; body is a sealed classrup.notify.preference_mirror/v1 envelope for one channel] { statement } | { outcome: applied\|stale, appliedCid, effectiveCid, effectiveDeviceKeyId, relayReceiptAt, acceptance?: { cid, sig } (applied only) } | VALIDATION_FAILED, PRECONDITION_FAILED, CONFLICT_STATE, UNAUTHENTICATED, RATE_LIMITED | notify.preference.changed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `notify.preference.get_matrix` | notify.preference.read_own | [vault query] {} | { cells: NotificationPreference[] (8 plus other), channelStatus: { push, email }, defaultsVersion, relayUses: [{ relayId, channel, effectiveDeviceKeyId? }] } |  |
| `notify.preference.check` | notify.preference.check | [vault in-process query used by the F13.S02.M01 gate and F13.S01.M03 routing] { category, channel: in_app\|os_alert\|push\|email } | { allowed: boolean, locked: boolean, channelActive: boolean } | VALIDATION_FAILED |
| `notify.preference.resolve` | notify.preference.resolve | [relay internal query used by the hook dispatches of F13.S02.M01] { userDid, category, channel: push\|email } | { allowed: boolean, source: mirror\|defaults, effectiveCid?, defaultsVersion } | VALIDATION_FAILED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `notify.preference.changed` | P2 | { userDid, categories[], channelsChanged[], mirrorSeq?, defaultsVersion, side: vault\|relay } — vault-local from set and reset; relay-local from mirror and from consent or key changes that change the effective cells |

### Events consumed

| Type | Effect |
|---|---|
| `notify.channel.opted_in` | vault instance: mark the channel active in the matrix and queue that channel's column as a mirror statement after the consent registration in the same per-relay outbox |
| `notify.channel.opted_out` | vault instance: mark the channel inactive in the UI while keeping stored flags; relay instance (relay-local event): delete the user's rows for that channel at once when no granted consent for it remains at this relay and emit relay-local notify.preference.changed |
| `security.key.revoked` | relay instance: rows of the revoked device key stop being effective and later mirrors signed by it are refused UNAUTHENTICATED; emit relay-local notify.preference.changed when the effective cells change |
| `privacy.deletion.completed` | vault instance: notification only; confirm that the DeletionPort purge step removed the matrix; nothing is signed |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| NOTIFY_PREF_LOCKED | 422 | no | the security in-app cell cannot be switched off and the activity in-app cell cannot be switched on |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Execution sites (ADR-0016): set, reset, get_matrix and check run in the vault; mirror and resolve on the relay. The OS alert follows the in-app column (check with channel os_alert returns the inApp flag). Statement (N2, registered with F11.S01.M01): classrup.notify.preference_mirror/v1 - CTR-FED-001 envelope, author the principal did:key, ext.signerKey the device key, ext.stream notify.preference.<channel>, seq and prev per (author, signerKey, stream) (FED-8); signer role principal; audience the relay named in payload relayId, sealed to that relay's published key; payload exactly {relayId, channel, cells: {offers, cycles, messages, auctions, bookings, moderation, security, activity}, defaultsVersion}; maxAge 400 d. Effective mirror per channel - the head accepted most recently across the user's chains whose device key is active; no effective mirror means the versioned defaults. There is no cross-device merge. Privacy ports (N6): ExportSectionPort section notify.preferences with schema classrup.notify.preference/v1; DeletionPort plan {willDelete: the matrix, willPseudonymize: none, blockers: none} and step purge (relay copies are deleted when the F13.S02.M03 sign-step withdrawals are registered); RetentionPurgePort kind notify.preference, class RET-STANDARD, anchorField updatedAtClaim. Every field is classified with F10.S02.M02.

### Example

```
vault command notify.preference.set  { "cells": [ { "category": "auctions", "push": false, "expectedRevision": 1 } ] }
-> { "cells": [ { "category": "auctions", "inApp": true, "push": false, "email": false, "revision": 2 } ], "mirrorStates": [ { "relayId": "relay:k3n7v2…", "channel": "push", "syncState": "prepared" } ] }
relay command notify.preference.mirror { "statement": <sealed classrup.notify.preference_mirror/v1, channel push, seq 3> }
-> { "outcome": "applied", "appliedCid": "sha256-c4…", "effectiveCid": "sha256-c4…", "effectiveDeviceKeyId": "…#d1", "relayReceiptAt": "2026-11-04T10:00:01Z", "acceptance": { "cid": "sha256-c4…", "sig": "…" } }
vault command notify.preference.set  { "cells": [ { "category": "security", "inApp": false, "expectedRevision": 1 } ] }
-> 422 NOTIFY_PREF_LOCKED
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-106-09.T05 | contract | PS-106-04.R01, PS-106-04.R02, PS-106-09.R02 | each command and query executes in its environment | outputs, statements and event payloads validate against registry schemas; relay-local changed emitted in the SQLite transaction of an applied mirror |
| TEST-PS-106-09.T06 | integration | PS-106-04.R03, PS-106-02.R04 | vault-local opted_in and opted_out; push flag set before push consent | channel shown active or inactive; flag stored inactive and not mirrored until consent; column mirrored after the registration on opt-in |
| TEST-PS-106-09.T16 | integration | PS-106-04.R04, PS-106-04.R05 | registry lookup of classrup.notify.preference_mirror/v1; DeletionPort plan and purge, export section and retention purge with F10 doubles; check for os_alert | signer role principal and audience relayId present; purge removes the matrix; section notify.preferences exported; os_alert follows inApp |

## Dependencies

Module depends on: F13.S02.M03, F11.S01.M01, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
