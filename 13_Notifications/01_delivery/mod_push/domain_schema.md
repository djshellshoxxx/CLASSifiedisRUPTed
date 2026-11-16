# PS-104-01 — Domain schema: Web push delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M01 Web push delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/push` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-104-01.R01** A PushSubscription stores the user DID, device ID, the push endpoint URL, the browser public key p256dh (65 bytes) and auth secret (16 bytes), the content encoding aes128gcm, status, counters and consent reference, with tenant and revision per CTR-ID-001.
- **PS-104-01.R02** The endpoint and keys are P3 secrets (the endpoint is a bearer capability to wake that browser) held only at the selected relay, encrypted at rest with the relay storage key, never exported to other users and never placed in events.
- **PS-104-01.R03** Payloads are content-free JSON {v, ref, tpl, ck, urg} of at most 1 024 bytes before encryption, where ref is a type plus opaque ID, tpl a template key, ck a collapse key and urg normal or high.

## Specification

### PushSubscription

Schema `classrup.notify.push_subscription/v1` · storage **relay** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| userDid | did:key — owner |
| deviceId | uuidv7 — registered device that created it |
| endpoint | url — https only, ≤ 2 048 characters, P3 secret |
| p256dh | bytes — 65 bytes uncompressed P-256 point, base64url |
| auth | bytes — 16 bytes, base64url |
| contentEncoding | enum — aes128gcm (RFC 8291) |
| expirationTime? | timestamp — from the browser subscription, if provided |
| consentId | uuidv7 — ref F13.S02.M03 ChannelConsent for push at this relay; must be granted |
| vapidKeyId | string — id of the relay VAPID key the subscription was created with |
| status | enum — active \| expired \| revoked |
| failureCount | int — consecutive transient failures, reset on success |
| lastSuccessAt? | timestamp — relay clock |
| lastFailureAt? | timestamp — relay clock |
| createdAt | timestamp — relay clock, RFC 3339 UTC |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most 10 active subscriptions per user and relay and at most one per (userDid, endpoint hash).
- status active implies a granted unexpired ChannelConsent for push exists and vapidKeyId equals a current relay key.
- endpoint, p256dh and auth are never returned by any query, event or log.

### Storage DDL

```sql
CREATE TABLE notify_push_subscription (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, user_did TEXT NOT NULL, device_id TEXT NOT NULL,
  endpoint_hash TEXT NOT NULL, status TEXT NOT NULL, failure_count INTEGER NOT NULL DEFAULT 0,
  last_success_at TEXT, revision INTEGER NOT NULL, secret BLOB NOT NULL);
CREATE UNIQUE INDEX notify_push_endpoint ON notify_push_subscription(user_did, endpoint_hash);
CREATE INDEX notify_push_user_active ON notify_push_subscription(user_did, status);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-104-09.T01 | unit | PS-104-01.R01, PS-104-01.R02, PS-104-01.R03, PS-104-02.R01, PS-104-02.R02 | subscribe with valid and malformed endpoint and keys | valid stored encrypted; invalid refused VALIDATION_FAILED; secrets absent from queries |
| TEST-PS-104-09.T03 | contract | PS-104-01.R03, PS-104-04.R01, PS-104-09.R02 | send a normal offers alert | fake push service decrypts payload with only keys v, ref, tpl, ck, urg; headers TTL 86400, Urgency normal, Topic, Content-Encoding aes128gcm; VAPID JWT valid ES256 with exp ≤ 12 h |

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
