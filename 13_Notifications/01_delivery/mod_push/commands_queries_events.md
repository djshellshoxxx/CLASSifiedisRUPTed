# PS-104-04 — Commands, queries and events: Web push delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M01 Web push delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/push` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-104-04.R01** The relay exposes subscribe, unsubscribe and an internal send command, plus a public VAPID key query; the vault exposes enable and disable commands that drive the browser PushManager and call the relay.
- **PS-104-04.R02** Each send attempt emits exactly one of notify.push.sent or notify.push.failed in the same transaction as the counter update.
- **PS-104-04.R03** The module consumes consent and preference events to revoke subscriptions and stay consistent.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `notify.push.enable` | notify.push.enable | [vault command; calls PushManager.subscribe with the relay VAPID key then relay command notify.push.subscribe] { relayId, deviceLabel } | { subscriptionId, status: active, syncState } | VALIDATION_FAILED, PRECONDITION_FAILED, NOTIFY_PUSH_SUBSCRIPTION_LIMIT, DEPENDENCY_UNAVAILABLE, FEATURE_DISABLED |  | yes (Idempotency-Key) |
| `notify.push.subscribe` | notify.push.subscribe | [relay command, request signed by a registered device key] { deviceId, endpoint, keys: { p256dh, auth }, expirationTime?, vapidKeyId } | { subscriptionId, status: active, relayReceiptAt } | VALIDATION_FAILED, PRECONDITION_FAILED, NOTIFY_PUSH_SUBSCRIPTION_LIMIT, UNAUTHENTICATED, RATE_LIMITED, FEATURE_DISABLED |  | yes (Idempotency-Key) |
| `notify.push.unsubscribe` | notify.push.unsubscribe | [vault command and relay command, signed by the owning device key] { subscriptionId, expectedRevision } | { subscriptionId, status: revoked, revision } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `notify.push.send` | notify.push.send | [relay internal command called by the F13.S02.M01 gate] { userDid, ref?, tpl, ck?, urg: normal\|high, ttlSeconds? } | { attempted, delivered, expired } | VALIDATION_FAILED, PAYLOAD_TOO_LARGE, DEPENDENCY_UNAVAILABLE, PRECONDITION_FAILED | notify.push.sent, notify.push.failed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `notify.push.get_key` | notify.push.read_key | [relay public query] {} | { vapidKeyId, applicationServerKey (65-byte P-256 public key, base64url), contact } | FEATURE_DISABLED |
| `notify.push.list_mine` | notify.push.read_own | [relay query signed by a device key] {} | { items: [{ subscriptionId, deviceId, deviceLabel, status, lastSuccessAt }] } (no endpoint, no keys) | UNAUTHENTICATED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `notify.push.sent` | P2 | { subscriptionId, userDid, tpl, httpStatus, attempt } |
| `notify.push.failed` | P2 | { subscriptionId, userDid, tpl, reason: gone\|throttled\|transient\|vapid_rejected\|too_large\|no_subscription, httpStatus?, attempt } |

### Events consumed

| Type | Effect |
|---|---|
| `notify.channel.opted_out` | revoke all active push subscriptions of the user at this relay when the channel is push |
| `notify.channel.opted_in` | enable the subscribe command for the user at this relay |
| `security.key.revoked` | if the revoked key is the relay VAPID key, expire subscriptions bound to it and require re-subscription |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| NOTIFY_PUSH_SUBSCRIPTION_LIMIT | 409 | no | the user already has 10 active push subscriptions at this relay |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
POST /api/v1/relay/notify.push.subscribe
Idempotency-Key: 0192f3b5-0000-7000-8000-000000000001
{ "deviceId": "0192f3b5-1111-7000-8000-000000000001", "endpoint": "https://push.example/send/…", "keys": { "p256dh": "BNc…", "auth": "tBH…" }, "vapidKeyId": "vapid-2026-11" }
201 { "subscriptionId": "0192f3b5-2222-7000-8000-000000000001", "status": "active", "relayReceiptAt": "2026-11-04T10:00:00.000Z" }
relay send (outbound to push service)
POST https://push.example/send/…   TTL: 86400   Urgency: normal   Topic: offer-0192f3a5   Content-Encoding: aes128gcm
Authorization: vapid t=<ES256 JWT exp +12h>, k=<applicationServerKey>
body (encrypted RFC 8291) of {"v":1,"ref":{"type":"offer","id":"0192f3a5-…"},"tpl":"notify.tpl.offers.made","ck":"offer-0192f3a5","urg":"normal"}
-> 201 Created
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-104-09.T03 | contract | PS-104-01.R03, PS-104-04.R01, PS-104-09.R02 | send a normal offers alert | fake push service decrypts payload with only keys v, ref, tpl, ck, urg; headers TTL 86400, Urgency normal, Topic, Content-Encoding aes128gcm; VAPID JWT valid ES256 with exp ≤ 12 h |
| TEST-PS-104-09.T05 | integration | PS-104-04.R02, PS-104-06.R02 | push service returns 429 with Retry-After 120 then 201 | one retry after 120 s, one notify.push.sent event, attempts recorded |
| TEST-PS-104-09.T06 | integration | PS-104-04.R03, PS-104-03.R03 | channel opted out and VAPID key revoked events delivered | subscriptions revoked or expired and secrets erased |
| TEST-PS-104-09.T15 | a11y | PS-104-04.R01 | push settings and permission explainer with screen reader and keyboard | controls labelled, states announced, zero serious axe issues |

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
