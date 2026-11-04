# PS-106-04 — Commands, queries and events: In-app notification preferences

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M04 In-app notification preferences](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/in` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-106-04.R01** Matrix changes and reset are vault commands; the mirror is a relay command accepting a signed statement; relay-side lookup is an internal query.
- **PS-106-04.R02** Each vault command emits notify.preference.changed in the same IndexedDB transaction as the change.
- **PS-106-04.R03** The module consumes channel consent events to show channel status and to trigger mirroring when a channel is enabled.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `notify.preference.set` | notify.preference.set | [vault command; produces signed statement classrup.notify.preference_mirror/v1 when a relay holds push or email consent] { cells: [{ category, inApp?, push?, email?, expectedRevision }] (≤ 21) } | { cells: NotificationPreference[], mirrorState: none\|local_committed\|prepared\|transport_acknowledged\|peer_accepted } | VALIDATION_FAILED, NOTIFY_PREF_LOCKED, CONFLICT_REVISION, RATE_LIMITED | notify.preference.changed | yes (Idempotency-Key) |
| `notify.preference.reset` | notify.preference.set | [vault command; produces signed mirror statement] { confirm: true } | { cells: NotificationPreference[], defaultsVersion } | VALIDATION_FAILED, RATE_LIMITED | notify.preference.changed | yes (Idempotency-Key) |
| `notify.preference.mirror` | notify.preference.mirror | [relay command, relay access token] { statement: { userDid, seq, cells: [{ category, push, email }] (7), sig } } | { seq, relayReceiptAt, relayReceiptSig } | VALIDATION_FAILED, PRECONDITION_FAILED, CONFLICT_STATE, UNAUTHENTICATED, RATE_LIMITED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `notify.preference.get_matrix` | notify.preference.read_own | [vault query] {} | { cells: NotificationPreference[] (7), channelStatus: { push, email }, defaultsVersion } |  |
| `notify.preference.resolve` | notify.preference.resolve | [relay internal query] { userDid, category, channel: push\|email } | { allowed: boolean, seq } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `notify.preference.changed` | P2 | { userDid, categories[], channelsChanged[], mirrorSeq?, defaultsVersion } |

### Events consumed

| Type | Effect |
|---|---|
| `notify.channel.opted_in` | mark the channel active in the matrix and send a mirror statement to the relay that now holds the consent |
| `notify.channel.opted_out` | mark the channel inactive in the UI while keeping stored flags; the relay already stops sending |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| NOTIFY_PREF_LOCKED | 422 | no | the security category in-app notifications cannot be switched off |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command notify.preference.set  { "cells": [ { "category": "auctions", "push": false, "expectedRevision": 1 } ] }
-> { "cells": [ { "category": "auctions", "inApp": true, "push": false, "email": false, "revision": 2 } ], "mirrorState": "local_committed" }
vault command notify.preference.set  { "cells": [ { "category": "security", "inApp": false, "expectedRevision": 1 } ] }
-> 422 NOTIFY_PREF_LOCKED
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-106-09.T05 | contract | PS-106-04.R01, PS-106-04.R02, PS-106-09.R02 | each command and query executes | outputs, statements and event payloads validate against registry schemas |
| TEST-PS-106-09.T06 | integration | PS-106-04.R03 | channel opted in and opted out events delivered | channel shown active or inactive; relay snapshot sent on opt-in |
| TEST-PS-106-09.T14 | a11y | PS-106-04.R01 | matrix with screen reader and keyboard | table semantics, locked switch explained, zero serious axe issues |

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
