# PS-108-04 — Commands, queries and events: Quiet-hours enforcement

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M01 Quiet-hours enforcement](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/quiet` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-108-04.R01** Dispatch is a command usable by relay hooks and by the vault; it applies the gate and returns the decision sent, deferred or dropped.
- **PS-108-04.R02** Release is an internal command run by the sweep; both emit their events in the same transaction as the record change.
- **PS-108-04.R03** The module consumes inbox, schedule, consent and preference events to cancel or recompute deferred items.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `notify.notification.dispatch` | notify.notification.dispatch | [relay command for push and email, vault command for os_alert; callers are relay hooks or a registered device of the user] { userDid, channel, category, templateKey, ref?, collapseKey?, urgency?: normal\|urgent, notificationId? } | { decision: sent\|deferred\|dropped, deferredId?, releaseAt?, reason? } | VALIDATION_FAILED, PRECONDITION_FAILED, NOTIFY_CATEGORY_DISABLED, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | notify.notification.deferred | yes (Idempotency-Key) |
| `notify.notification.release` | notify.notification.release | [internal sweep, relay or vault] { now, batchSize ≤ 500 } | { released, dropped, cancelled } | DEPENDENCY_UNAVAILABLE | notify.notification.released | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `notify.notification.list_deferred` | notify.notification.read_deferred | [vault query, or relay query signed by device key] { channel?, limit ≤ 100 } | { counts: [{ category, channel, count }], items: DeferredNotification[] } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `notify.notification.deferred` | P2 | { deferredId, userDid, channel, category, templateKey, releaseAt } |
| `notify.notification.released` | P2 | { deferredId, userDid, channel, category, digest: boolean, count } |

### Events consumed

| Type | Effect |
|---|---|
| `notify.notification.created` | vault path: for the local principal evaluate the os_alert channel with the gate, and request push or email dispatch from the user's relay for channels with consent |
| `notify.notification.read` | cancel deferred items linked to the notification with reason read_in_app |
| `notify.quiet_hours.changed` | recompute releaseAt for deferred items of the user and send those no longer in quiet hours within 60 s |
| `notify.channel.opted_out` | drop deferred items of that channel with reason no_consent |
| `notify.preference.changed` | drop deferred items of categories now switched off for the channel with reason category_off |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| NOTIFY_CATEGORY_DISABLED | 409 | no | the matrix does not allow this category on this channel for the user |
| NOTIFY_DEFER_EXPIRED | 410 | no | the item was deferred for 24 hours and was dropped |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
POST /api/v1/relay/notify.notification.dispatch
Idempotency-Key: 0192f3b4-0000-7000-8000-000000000001
{ "userDid": "did:key:z6Mk…", "channel": "push", "category": "offers", "templateKey": "notify.tpl.offers.made", "ref": { "type": "offer", "id": "0192f3a5-1111-7000-8000-000000000001" }, "collapseKey": "offer-0192f3a5" }
202 { "decision": "deferred", "deferredId": "0192f3b4-2222-7000-8000-000000000001", "releaseAt": "2026-11-05T06:02:41.000Z" }
POST /api/v1/relay/notify.notification.dispatch   { …, "category": "security", "templateKey": "notify.tpl.security.device_added", "urgency": "urgent" }
200 { "decision": "sent" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-108-09.T05 | contract | PS-108-04.R01, PS-108-04.R02, PS-108-09.R02 | dispatch, release, list_deferred execute | outputs and event payloads validate against registry schemas |
| TEST-PS-108-09.T06 | integration | PS-108-04.R03 | quiet_hours.changed, channel.opted_out, preference.changed and notification.read events delivered | deferred items recomputed, dropped or cancelled with documented reasons |

## Dependencies

Module depends on: F13.S02.M02, F13.S02.M03, F13.S02.M04, F13.S01.M01, F13.S01.M02, F13.S01.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
