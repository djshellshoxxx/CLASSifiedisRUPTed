# PS-104-01 — Domain schema: Web push delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M01 Web push delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/push` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-104-01.R01** A relay PushSubscription service copy stores the user DID, the ID of the device key that created it, the push endpoint URL, the browser public key p256dh (65 bytes) and auth secret (16 bytes), the content encoding aes128gcm, a per-subscription topic key, status, counters and the registered consent reference, with tenant and revision per CTR-ID-001.
- **PS-104-01.R02** The relay copy is a disclosed service copy under the CTR-PRV-001 PRV-10 notification channel exception - only the channel identifiers endpoint, p256dh, auth and the per-subscription topic key, held by the single relay named in the granted notify_push consent (F10.S01.M01) and stored there P3-equivalent; the subscribe body is sealed to that relay's published key, endpoint, keys and topic key are encrypted at rest, used only for content-free notifications (CTR-EVT-001 EVT-4), never exported, evented, logged or federated, and erased in the same transaction as the registered withdrawal, unsubscribe or expiry and so within the PRV-10 24 h bound, and the relay copy is never authoritative because the vault record and the browser rebuild it.
- **PS-104-01.R03** Push payloads are content-free JSON of at most 1 024 bytes in exactly one of three forms: sealed {v, urg, s} for vault-originated alerts, whose box s opens only on the target device to {v, tpl, ref, ck}; hook {v, urg, tpl, ref?, ck?} carrying only data the dispatching relay hook already holds; and digest {v, urg, tpl: notify.tpl.system.digest, n}.
- **PS-104-01.R04** The vault push target record is the authoritative user-owned record per device - relayId, deviceKeyId, deviceLabel, enabled, the relay subscriptionId, a status mirror and the consent reference - while the browser PushManager holds the endpoint and keys, so the vault stores neither and rebuilds the relay copy from the record and a fresh browser subscription.
- **PS-104-01.R05** The relay VAPID key pair is owned by this module through RelayKeyStorePort (private key in the relay key file store, mode 0600, never in SQLite, logs, events or exports), and every VAPID public key is registered with purpose vapid in F16.S02.M02, which also records its revocation.

## Specification

### PushSubscription

Schema `classrup.notify.push_subscription/v1` · storage **relay** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — subscriptionId, primary key |
| tenantId | uuidv7 — relay tenant scope |
| userDid | did:key — owner principal |
| createdByKeyId | string — device key ID that signed the subscribe request; revocation of this key revokes the subscription |
| secret | bytes — AES-256-GCM ciphertext of { endpoint (https, ≤ 2 048 chars), p256dh (65 bytes), auth (16 bytes), topicKey (32 random bytes) } under the relay storage key |
| endpointHash | bytes — HMAC-SHA256 of the endpoint with a relay secret, for uniqueness |
| pushOrigin | string — allowlisted push-service origin of the endpoint, for example https://fcm.googleapis.com |
| contentEncoding | enum — aes128gcm (RFC 8291) |
| expirationTime? | timestamp — from the browser subscription, if provided |
| consentId | uuidv7 — ChannelConsent for push registered at this relay (F13.S02.M03); must be granted |
| consentStatementCid | string — cid of the registered channel consent statement |
| vapidKeyId | string — id of the relay VAPID key the subscription was created with |
| status | enum — active \| expired \| revoked |
| failureCount | int — consecutive failures including 401 and 403 of this subscription, reset on success |
| firstFailureAt? | timestamp — relay clock, start of the current failure streak |
| lastSuccessAt? | timestamp — relay clock |
| endedAt? | timestamp — relay clock of the terminal transition |
| createdAt | timestamp — relay clock, RFC 3339 UTC |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most 10 active subscriptions per user and relay and at most one per (userDid, endpointHash).
- status active implies a registered granted unexpired push ChannelConsent, an active createdByKeyId per F16.S02.M02 and a vapidKeyId held in RelayKeyStorePort.
- secret is erased in the same transaction as the transition to expired or revoked; endpoint, keys and topic key are never returned by any query, event or log.

### PushSubscription

Schema `classrup.notify.push_target/v1` · storage **device** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — pushTargetId, primary key |
| vaultId | uuidv7 — local vault scope (CTR-ID-001 tenant slot) |
| userDid | did:key — local principal |
| relayId | string — canonical self-certifying relayId (F15.S02.M01) of the selected relay |
| relayHost | string — display hint only, never used for matching |
| deviceKeyId | string — this device's key that signs the relay requests |
| deviceLabel | string — 1..60 characters, vault only, never sent to the relay |
| enabled | boolean — user choice on this device |
| subscriptionId? | uuidv7 — relay subscription once accepted |
| vapidKeyId? | string — VAPID key the browser subscription is bound to |
| consentId | uuidv7 — local ChannelConsent for push at relayId |
| status | enum — pending \| active \| disabled \| expired |
| lastSyncedAt? | timestamp — local clock of the last notify.push.list_mine result |
| endedAt? | timestamp — local clock of disable or expiry |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most one non-ended push target per (relayId, deviceKeyId).
- The record never contains the endpoint, p256dh or auth; the browser PushManager is their only holder on the device.
- status active implies a granted local push ChannelConsent and privacy.consent.check for notify_push at relayId returning granted.

### Storage DDL

```sql
CREATE TABLE notify_push_subscription (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, user_did TEXT NOT NULL, created_by_key_id TEXT NOT NULL,
  endpoint_hash TEXT NOT NULL, push_origin TEXT NOT NULL, status TEXT NOT NULL, failure_count INTEGER NOT NULL DEFAULT 0,
  first_failure_at TEXT, last_success_at TEXT, consent_id TEXT NOT NULL, vapid_key_id TEXT NOT NULL,
  ended_at TEXT, revision INTEGER NOT NULL, secret BLOB);
CREATE UNIQUE INDEX notify_push_endpoint ON notify_push_subscription(user_did, endpoint_hash);
CREATE INDEX notify_push_user_active ON notify_push_subscription(user_did, status);
CREATE INDEX notify_push_key ON notify_push_subscription(created_by_key_id, status);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-104-09.T01 | unit | PS-104-01.R01, PS-104-01.R02, PS-104-02.R01 | subscribe with valid and malformed sealed bodies | valid stored with secret encrypted and pushOrigin set; malformed refused VALIDATION_FAILED; secrets absent from every query |
| TEST-PS-104-09.T03 | contract | PS-104-01.R03, PS-104-02.R02, PS-104-04.R01, PS-104-09.R02, PS-104-09.R03 | send a sealed, a hook and a digest payload; run every command, query and event of this module | fake push service decrypts exactly the keys of each form; headers TTL, Urgency, Topic and Content-Encoding aes128gcm; VAPID JWT valid ES256 with exp ≤ 12 h; inputs, outputs and event payloads validate against the schema registry entries |
| TEST-PS-104-09.T06 | integration | PS-104-04.R03, PS-104-03.R03, PS-104-01.R02 | relay-local notify.channel.opted_out for push, security.key.revoked with purpose vapid and relationship relay_owned, and security.key.revoked with purpose device_signing delivered to the relay instance; vault-local opted_out to the vault instance | relay subscriptions revoked or expired with secrets erased in the same transaction without any key status lookup; vault target disabled and PushManager.unsubscribe called |
| TEST-PS-104-09.T10 | abuse | PS-104-07.R01, PS-104-07.R02, PS-104-07.R03, PS-104-07.R04, PS-104-01.R02 | inspect database, field classification, logs, events, exports and metrics; endpoint at 169.254.169.254; an allowlisted host re-resolving to 10.0.0.5 at send time (DNS rebinding); a redirecting endpoint | no endpoint, topic key or payload outside encrypted storage; the relay copy secret is classified P3 (CTR-PRV-001 PRV-10) and absent from exports and federation; each blocked endpoint refused with NOTIFY_PUSH_ENDPOINT_REJECTED without a connection |
| TEST-PS-104-09.T18 | unit | PS-104-01.R04, PS-104-03.R04, PS-104-04.R04 | enable, disable and expiry discovered by list_mine in the vault; inspect the push target record and the outgoing request | target moves pending, active, then disabled or expired; record holds no endpoint or keys; subscribe body is sealed and the request carries no device label |
| TEST-PS-104-09.T19 | integration | PS-104-01.R05, PS-104-04.R05, PS-104-05.R03 | operator rotates the VAPID key; DeletionPort plan and purge, export section and retention purge with F10 registry doubles | new key registered with purpose vapid in F16.S02.M02; private key never leaves RelayKeyStorePort; purge removes targets and calls PushManager.unsubscribe; section notify.push exported; targets purged 30 days after endedAt |

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M02, F16.S02.M01, F11.S01.M03, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
