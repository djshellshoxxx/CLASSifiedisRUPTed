# PS-108-04 — Commands, queries and events: Quiet-hours enforcement

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M01 Quiet-hours enforcement](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/quiet` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-108-04.R01** Dispatch is one command with three modes - the vault mode receives routing decisions through NotificationDispatchPort, the sealed relay mode receives requests signed by a device key of the user, and the hook mode receives in-process calls from relay hooks (mailbox put, auction host, cycle matching, moderation).
- **PS-108-04.R02** Release is an internal sweep in both environments and cancel is a relay command signed by a device key; release emits its event in the same transaction as the record change.
- **PS-108-04.R03** The vault instance consumes vault-local inbox, schedule, consent, preference and deletion events, and the relay instance consumes the relay-local consent, quiet-hours and preference events emitted by the registration and mirror commands, as labelled per environment under events_consumed.
- **PS-108-04.R04** For vault-originated push the gate seals {v, tpl, ref, ck} per target device with the F08.S01.M01 envelope construction to that device's x25519 agreement key and sends the relay only {userDid, channel, urgency, dispatchId, notBefore?, collapseTag, boxes}; email requests carry no box and select a generic template by urgency.
- **PS-108-04.R05** When notify.notification.read arrives the vault cancels its local items and calls the relay command notify.notification.cancel for items it handed off, so a deferred push is never sent for a notification already read.
- **PS-108-04.R06** The module registers ExportSectionPort (section notify.deferred, counts only), DeletionPort (purge step) and RetentionPurgePort (kind notify.deferred) with F10 (N6), classifies every field with F10.S02.M02, calls privacy.consent.check in the vault, holds non-security decisions while privacy.deletion.assert_not_pending reports a pending deletion, and routes limits through RateLimitPort (N18).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `notify.notification.dispatch` | notify.notification.dispatch | [vault mode: in-process NotificationDispatchPort.route { sourceEventId, notificationId?, category, templateKey, ref?, collapseKey?, urgency, muted, arrival: mailbox\|direct\|local, collapsed }; sealed relay mode: relay command signed by an active device key of userDid { userDid, channel: push\|email, urgency: normal\|urgent, dispatchId, notBefore?, collapseTag, boxes?: [{ deviceKeyId, s }] }; hook mode: in-process relay call { userDid, channel: push, category, templateKey, ref?, collapseKey?, hookSource: mailbox\|auction_host\|cycle_match\|moderation }] | { decision: sent\|deferred\|dropped, perChannel?: [{ channel, decision, reason? }] (vault mode), deferredId?, releaseAt?, reason? } | VALIDATION_FAILED, UNAUTHENTICATED, FORBIDDEN, PRECONDITION_FAILED, NOTIFY_CATEGORY_DISABLED, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | notify.notification.deferred | yes (Idempotency-Key) |
| `notify.notification.release` | notify.notification.release | [internal sweep in the relay and in the running vault] { now, batchSize ≤ 500 } | { released, dropped, redeferred, digests } | DEPENDENCY_UNAVAILABLE | notify.notification.released | yes (Idempotency-Key) |
| `notify.notification.cancel` | notify.notification.cancel | [relay command signed by an active device key of userDid] { userDid, dispatchIds: uuidv7[1..50], reason: read_in_app\|preference_changed\|user_cancelled } | { cancelled, alreadyFinal } | VALIDATION_FAILED, UNAUTHENTICATED, FORBIDDEN, RATE_LIMITED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `notify.notification.list_deferred` | notify.notification.read_deferred | [vault query; or relay query signed by an active device key of the owner, which returns counts only] { channel?, limit ≤ 100 } | { counts: [{ category?, channel, count }], items?: DeferredNotification[] (vault only) } | UNAUTHENTICATED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `notify.notification.deferred` | P2 | { deferredId, userDid, channel, category? (absent for vault-origin relay items), releaseAt, side: vault\|relay } — no template key, reference or collapse key |
| `notify.notification.released` | P2 | { deferredId, userDid, channel, category?, digest: boolean, count, reason: window_end\|schedule_changed\|retry, side: vault\|relay } |

### Events consumed

| Type | Effect |
|---|---|
| `notify.notification.read` | vault instance: cancel deferred items linked to the notification with reason read_in_app and call notify.notification.cancel at the relay for its handed_off items |
| `notify.quiet_hours.changed` | vault instance (vault-local): recompute releaseAt of local items and release within 60 s those no longer quiet with reason schedule_changed; relay instance (relay-local event of notify.quiet_hours.mirror): the same for the user's relay items using the newly applied mirror |
| `notify.channel.opted_out` | vault instance: drop local items of that channel and relay with reason no_consent; relay instance (relay-local event of the registration, unsubscribe or expiry sweep): drop the user's relay items of that channel |
| `notify.preference.changed` | vault instance: drop local items whose category is now off for their channel (os_alert by inApp) and cancel handed_off items of those categories at the relay with reason preference_changed; relay instance (relay-local event of notify.preference.mirror): drop hook items of categories now off |
| `privacy.deletion.requested` | vault instance: reversible pause only - while privacy.deletion.assert_not_pending reports a pending deletion, non-security decisions are held and nothing is sent to relays; nothing is erased, and because the pause is derived from the guard a cancelled request resumes without any undo |
| `privacy.deletion.completed` | vault instance: notification only; confirm that the DeletionPort purge step removed every vault deferred row; nothing is signed and no relay is called |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| NOTIFY_CATEGORY_DISABLED | 409 | no | the matrix does not allow this category on this channel for the user |
| NOTIFY_DEFER_EXPIRED | 410 | no | the item was deferred for 24 hours and was dropped |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Execution sites (ADR-0016): vault mode, the vault sweep and the vault list run in the vault (also inside the service worker); sealed mode, hook mode, the relay sweep, cancel and the relay list run on the relay. Vault decision per channel - os_alert: inApp cell (security always), Notification permission, app or service worker running, quiet hours from the local schedule; push: not for arrival mailbox, push cell, privacy.consent.check notify_push and the registered ChannelConsent, target devices are the principal's other active device keys with an active subscription per the cached notify.push.list_mine; email: email cell, privacy.consent.check notify_email, verified email target. Deferred push and email are handed to the relay at once with notBefore so they survive the app closing. collapseTag = first 22 characters of base64url(HMAC-SHA256(tag key derived by HKDF from the dispatching device's agreement key, userDid || collapseKey)), so two users never share a tag. Hook mode - the mailbox hook always uses category activity and template notify.tpl.activity.wake and is collapsed when any push reached the user in the last 60 s; the mailbox hook also evaluates the activity email cell (default off) and queues at most one activity notice per user per 6 hours; other hooks may carry only the auction, cycle suggestion or moderation identifiers the relay already holds. Relays never see privacy.consent.check; they rely only on the registered channel consent whose statement carries the F10 consent ID and purpose. No statement is produced; requests are signed relay requests checked against F16.S02.M02. Privacy ports (N6): ExportSectionPort section notify.deferred (counts per category and channel only); DeletionPort plan {willDelete: vault deferred rows, willPseudonymize: none, blockers: none} and step purge; RetentionPurgePort kind notify.deferred, class RET-EPHEMERAL, anchorField expiresAt. Every field is classified with F10.S02.M02.

### Example

```
vault: NotificationDispatchPort.route { "sourceEventId": "0192f3b7-…", "category": "security", "templateKey": "notify.tpl.security.device_added", "urgency": "urgent", "arrival": "local", "muted": false, "collapsed": false }
-> os_alert sent; push: seal {v, tpl, ref: null, ck} to device B's agreement key; email: security cell on, verified
POST /api/v1/relay/notify.notification.dispatch   (signed classrup/relay-request/v1 by device key …#d1)
Idempotency-Key: 0192f3b4-0000-7000-8000-000000000001
{ "userDid": "did:key:z6Mk…", "channel": "push", "urgency": "urgent", "dispatchId": "0192f3b4-1111-7000-8000-000000000001", "collapseTag": "Vq3xK9mZ0aR4tYuPq2wE1c", "boxes": [ { "deviceKeyId": "…#d2", "s": "<sealed>" } ] }
200 { "decision": "sent" }
relay hook (mailbox put for an offer at 03:00 local): { "userDid": "did:key:z6Mk…", "channel": "push", "category": "activity", "templateKey": "notify.tpl.activity.wake", "hookSource": "mailbox" }
-> { "decision": "deferred", "deferredId": "0192f3b4-2222-7000-8000-000000000001", "releaseAt": "2026-11-05T12:02:41.000Z" }
vault reads the notification -> POST notify.notification.cancel { "userDid": "did:key:z6Mk…", "dispatchIds": ["0192f3b4-3333-…"], "reason": "read_in_app" } -> { "cancelled": 1, "alreadyFinal": 0 }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-108-09.T05 | contract | PS-108-04.R01, PS-108-04.R02, PS-108-09.R02 | dispatch in all three modes, release, cancel and list_deferred execute | outputs and event payloads validate against registry schemas; events carry no template key, reference or collapse key |
| TEST-PS-108-09.T06 | integration | PS-108-04.R03, PS-108-03.R03 | vault-local quiet_hours.changed, channel.opted_out, preference.changed and notification.read; relay-local quiet_hours.changed, opted_out and preference.changed from the mirror and registration commands | items recomputed, released with reason schedule_changed, dropped or cancelled with documented reasons in each environment |
| TEST-PS-108-09.T15 | abuse | PS-108-07.R04, PS-108-04.R04 | U and W in one cycle both receive cycle alerts dispatched from their vaults through relay R; capture R's database, logs, events and push headers | no cycleId, threadId, template key or collapse key appears; U's and W's tags, Topics and boxes share no identifier; R cannot open the boxes |
| TEST-PS-108-09.T17 | integration | PS-108-04.R05, PS-108-03.R01 | push handed off with notBefore 07:00; user reads the row at 06:30 | notify.notification.cancel acknowledged; vault item cancelled; relay sends nothing |
| TEST-PS-108-09.T19 | integration | PS-108-04.R06 | deletion requested, then cancelled on day 13; DeletionPort plan and purge, export section and retention purge with F10 doubles | during grace non-security decisions held and no relay request sent; after cancel dispatch resumes with no undo; purge removes vault rows; section notify.deferred has counts only |

## Dependencies

Module depends on: F13.S02.M02, F13.S02.M03, F13.S02.M04, F13.S01.M01, F13.S01.M02, F13.S01.M03, F08.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F16.S02.M02, F07.S02.M01, F15.S01.M01, F12.S03.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
