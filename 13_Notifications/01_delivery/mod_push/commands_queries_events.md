# PS-104-04 — Commands, queries and events: Web push delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M01 Web push delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/push` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-104-04.R01** The relay exposes the sealed subscribe, unsubscribe and list requests, the internal send command, the public VAPID key query and an operator VAPID rotation command; the vault exposes enable, disable and a local view that drive the browser PushManager and call the relay.
- **PS-104-04.R02** Each send attempt emits exactly one relay-local notify.push.sent or notify.push.failed in the same SQLite transaction as the counter update, without endpoint, collapse key or reference, and without a template key for sealed sends.
- **PS-104-04.R03** The relay instance consumes relay-local channel consent events and key revocations, and the vault instance consumes vault-local channel consent events and privacy.deletion.completed, as labelled per environment under events_consumed.
- **PS-104-04.R04** No signed statement is produced; subscribe, unsubscribe and list are signed relay requests (classrup/relay-request/v1) whose subscribe body is sealed to the relay's published key, and the VAPID public key is registered with F16.S02.M02 purpose vapid.
- **PS-104-04.R05** The module registers ExportSectionPort (section notify.push), DeletionPort (purge step) and RetentionPurgePort (kind notify.push_target) with F10 (N6), annotates every field with its F10.S02.M02 class, calls privacy.consent.check for notify_push before enable, and routes every limit through RateLimitPort of F12.S03.M03 (N18).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `notify.push.enable` | notify.push.enable | [vault command; requires privacy.consent.check {purpose: notify_push, relayId} granted and the local push ChannelConsent registered (F13.S02.M03); calls PushManager.subscribe with the relay VAPID key, seals {endpoint, keys, expirationTime} to the relay's published key and calls notify.push.subscribe] { relayId, deviceLabel } | { pushTargetId, subscriptionId?, status: pending\|active } | VALIDATION_FAILED, PRECONDITION_FAILED, NOTIFY_PUSH_SUBSCRIPTION_LIMIT, NOTIFY_PUSH_ENDPOINT_REJECTED, DEPENDENCY_UNAVAILABLE, FEATURE_DISABLED |  | yes (Idempotency-Key) |
| `notify.push.disable` | notify.push.disable | [vault command; calls PushManager.unsubscribe on this device, marks the push target disabled and queues notify.push.unsubscribe in the F15.S01.M01 sync outbox] { pushTargetId, expectedRevision } | { pushTargetId, status: disabled, revision, relaySync: prepared\|transport_acknowledged\|done } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `notify.push.subscribe` | notify.push.subscribe | [relay command; request signed by a device key of userDid (classrup/relay-request/v1); body sealed to the relay's published key] { consentId, vapidKeyId, sealed: { endpoint, keys: { p256dh, auth }, expirationTime? } } | { subscriptionId, status: active, relayReceiptAt } | VALIDATION_FAILED, NOTIFY_PUSH_ENDPOINT_REJECTED, PRECONDITION_FAILED, NOTIFY_PUSH_SUBSCRIPTION_LIMIT, UNAUTHENTICATED, RATE_LIMITED, FEATURE_DISABLED |  | yes (Idempotency-Key) |
| `notify.push.unsubscribe` | notify.push.unsubscribe | [relay command; request signed by a device key of the subscription owner] { subscriptionId } | { subscriptionId, status: revoked } | NOT_FOUND, UNAUTHENTICATED, RATE_LIMITED |  | yes (Idempotency-Key) |
| `notify.push.send` | notify.push.send | [relay internal command called only by the F13.S02.M01 gate] { userDid, form: sealed\|hook\|digest, boxes?: [{ deviceKeyId, s }] (sealed, ≤ 10), hook?: { tpl, ref?, ck? }, n? (digest), collapseTag, urg: normal\|high, ttlSeconds? } | { attempted, delivered, expired } | VALIDATION_FAILED, PAYLOAD_TOO_LARGE, NOTIFY_PUSH_ENDPOINT_REJECTED, DEPENDENCY_UNAVAILABLE, PRECONDITION_FAILED | notify.push.sent, notify.push.failed | yes (Idempotency-Key) |
| `notify.push.rotate_key` | notify.push.rotate_key | [relay operator command; RelayKeyStorePort generates a new P-256 pair, the public key is registered with F16.S02.M02 purpose vapid and the old key is kept for 30 days, or revoked at once when compromised] { reason: scheduled\|compromised } | { vapidKeyId, previousVapidKeyId, keyRecordId } | FORBIDDEN, CONFLICT_STATE, DEPENDENCY_UNAVAILABLE |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `notify.push.get_key` | notify.push.read_key | [relay public query] {} | { vapidKeyId, applicationServerKey (65-byte P-256 public key, base64url), contact } | FEATURE_DISABLED, RATE_LIMITED |
| `notify.push.list_mine` | notify.push.read_own | [relay query signed by a device key of the user] {} | { items: [{ subscriptionId, deviceKeyId, status, lastSuccessAt }] } (no endpoint, no keys, no labels) | UNAUTHENTICATED, RATE_LIMITED |
| `notify.push.get_local` | notify.push.read_local | [vault query; joins this vault's push targets and the cached notify.push.list_mine result with device labels known locally (F07.S01.M01 device keys)] { relayId? } | { items: [{ pushTargetId?, deviceKeyId, deviceLabel, status, lastSuccessAt? }] } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `notify.push.sent` | P2 | { subscriptionId, userDid, form: sealed\|hook\|digest, tpl? (hook and digest forms only), httpStatus, attempt } — relay-local |
| `notify.push.failed` | P2 | { subscriptionId, userDid, form, tpl? (hook and digest forms only), reason: gone\|throttled\|transient\|rejected\|endpoint_rejected\|origin_paused\|too_large\|no_subscription, httpStatus?, attempt } — relay-local |

### Events consumed

| Type | Effect |
|---|---|
| `notify.channel.opted_out` | relay instance (relay-local event from notify.channel.register, notify.channel.unsubscribe or the expiry sweep): when channel is push, revoke every active subscription of userDid at this relay and erase its secret in the same transaction; vault instance (vault-local event): disable this device's push target for relayId and call PushManager.unsubscribe |
| `notify.channel.opted_in` | relay instance: allow subscribe for userDid at this relay once the consent is registered; vault instance: offer Enable on this device for relayId |
| `security.key.revoked` | relay instance: when keyId equals a createdByKeyId, revoke the subscriptions created by that device key and refuse its later requests; when keyId equals a vapidKeyId (purpose vapid confirmed with security.keyrecord.get_status because the payload carries no purpose), expire the subscriptions bound to it so vaults re-subscribe |
| `privacy.deletion.completed` | vault instance: notification only; confirm that the DeletionPort purge step removed every push target; nothing is signed and no relay is called |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| NOTIFY_PUSH_SUBSCRIPTION_LIMIT | 409 | no | the user already has 10 active push subscriptions at this relay |
| NOTIFY_PUSH_ENDPOINT_REJECTED | 422 | no | the push endpoint origin is not on the push-service allowlist or its host resolves to a private, loopback or link-local address |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Execution sites (ADR-0016): enable, disable and get_local run in the vault; subscribe, unsubscribe, list_mine, send, get_key and rotate_key run on the relay. No statement is produced; the relay requests are signed with a device key (classrup/relay-request/v1) and verified against F16.S02.M02 key status at receipt time, with principal resolution through the portable identity document of F07.S02.M01. Sealed payload boxes are produced by F13.S02.M01 with the F08.S01.M01 envelope construction to the target device's x25519 agreement key; the relay treats them as opaque bytes. Topic = first 32 characters of base64url(HMAC-SHA256(topicKey, collapseTag)), where collapseTag is opaque for sealed sends and HMAC-SHA256(relay tag secret, ck) for hook sends. RelayKeyStorePort {generate, sign(vapidKeyId, jwt), retire, revoke} keeps VAPID private keys in the relay key file store. Privacy ports (N6): ExportSectionPort section notify.push with schema classrup.notify.push_target/v1; DeletionPort plan {willDelete: push targets of this vault, willPseudonymize: none, blockers: none} and step purge, which calls PushManager.unsubscribe and deletes the targets (relay copies are erased when the F13.S02.M03 sign-step withdrawal is registered at each relay); RetentionPurgePort kind notify.push_target, class RET-STANDARD, anchorField endedAt, purge 30 days after the end. Every field is classified with F10.S02.M02.

### Example

```
vault command notify.push.enable { "relayId": "relay:k3n7v2…", "deviceLabel": "Alex phone" }
-> privacy.consent.check { purpose: notify_push, relayId } granted; channel consent registered; PushManager.subscribe(applicationServerKey)
POST /api/v1/relay/notify.push.subscribe   (signed classrup/relay-request/v1 by device key …#d2)
Idempotency-Key: 0192f3b5-0000-7000-8000-000000000001
{ "consentId": "0192f3b0-1111-7000-8000-000000000001", "vapidKeyId": "vapid-2026-11", "sealed": "<HPKE box of {endpoint, keys}>" }
201 { "subscriptionId": "0192f3b5-2222-7000-8000-000000000001", "status": "active", "relayReceiptAt": "2026-11-04T10:00:00.000Z" }
relay send (outbound to an allowlisted push service; address re-resolved and pinned)
POST https://fcm.googleapis.com/fcm/send/…   TTL: 86400   Urgency: high   Topic: q8Zt3kR0bWm1xY7aP2cV9nL4sD6fG8hJ   Content-Encoding: aes128gcm
Authorization: vapid t=<ES256 JWT exp +12h>, k=<applicationServerKey>
body (RFC 8291) of {"v":1,"urg":"high","s":"<box sealed by device A to device B's agreement key>"}
-> 201 Created; service worker on device B opens s -> {"v":1,"tpl":"notify.tpl.security.device_added","ref":null,"ck":"…"}
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-104-09.T03 | contract | PS-104-01.R03, PS-104-02.R02, PS-104-04.R01, PS-104-09.R02, PS-104-09.R03 | send a sealed, a hook and a digest payload; run every command, query and event of this module | fake push service decrypts exactly the keys of each form; headers TTL, Urgency, Topic and Content-Encoding aes128gcm; VAPID JWT valid ES256 with exp ≤ 12 h; inputs, outputs and event payloads validate against the schema registry entries |
| TEST-PS-104-09.T05 | integration | PS-104-04.R02, PS-104-06.R02 | push service returns 429 with Retry-After 120 then 201 | one retry after 120 s, one notify.push.sent with form and no tpl for sealed, attempts recorded |
| TEST-PS-104-09.T06 | integration | PS-104-04.R03, PS-104-03.R03, PS-104-01.R02 | relay-local notify.channel.opted_out for push and security.key.revoked for the VAPID key delivered to the relay instance; vault-local opted_out to the vault instance | relay subscriptions revoked or expired with secrets erased in the same transaction; vault target disabled and PushManager.unsubscribe called |
| TEST-PS-104-09.T18 | unit | PS-104-01.R04, PS-104-03.R04, PS-104-04.R04 | enable, disable and expiry discovered by list_mine in the vault; inspect the push target record and the outgoing request | target moves pending, active, then disabled or expired; record holds no endpoint or keys; subscribe body is sealed and the request carries no device label |
| TEST-PS-104-09.T19 | integration | PS-104-01.R05, PS-104-04.R05, PS-104-05.R03 | operator rotates the VAPID key; DeletionPort plan and purge, export section and retention purge with F10 registry doubles | new key registered with purpose vapid in F16.S02.M02; private key never leaves RelayKeyStorePort; purge removes targets and calls PushManager.unsubscribe; section notify.push exported; targets purged 30 days after endedAt |
| TEST-PS-104-09.T20 | contract | PS-104-04.R05, PS-104-02.R01 | enable with privacy.consent.check returning not granted, and with the channel consent not yet registered; 11th subscribe call in a day | PRECONDITION_FAILED before any browser prompt; RATE_LIMITED from RateLimitPort |

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
