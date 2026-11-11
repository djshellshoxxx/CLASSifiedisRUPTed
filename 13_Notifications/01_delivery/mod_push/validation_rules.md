# PS-104-02 — Validation rules: Web push delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M01 Web push delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/push` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-104-02.R01** Subscribe input is validated for signer key status, endpoint origin, keys, registered consent and limits before storage.
- **PS-104-02.R02** Send input is validated for payload form, size and Topic derivation before encryption, and the endpoint address is re-resolved, pinned and re-checked on every send.
- **PS-104-02.R03** Every violation maps to one stable error code.
- **PS-104-02.R04** The Topic header never carries a collapse key or reference; it is the first 32 characters of base64url(HMAC-SHA256(per-subscription topicKey, collapseTag)), so the push service sees an opaque value that differs between subscriptions and between users even for the same event.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | endpoint is https, at most 2 048 characters, its origin is on the push-service allowlist (default fcm.googleapis.com, updates.push.services.mozilla.com, web.push.apple.com and hosts under notify.windows.com; operator override per relay) and its host resolves only to public addresses | NOTIFY_PUSH_ENDPOINT_REJECTED |
| V02 | p256dh decodes to 65 bytes starting with 0x04 and auth decodes to 16 bytes | VALIDATION_FAILED |
| V03 | a granted unexpired push ChannelConsent of the user is registered at this relay (F13.S02.M03) and its consentId is named in the request | PRECONDITION_FAILED |
| V04 | the user has fewer than 10 active subscriptions at this relay | NOTIFY_PUSH_SUBSCRIPTION_LIMIT |
| V05 | payload JSON is at most 1 024 bytes before RFC 8291 encryption | PAYLOAD_TOO_LARGE |
| V06 | collapseTag is 1..64 characters of A-Z a-z 0-9 - _ . and the derived Topic matches ^[A-Za-z0-9_-]{1,32}$; hook and digest tpl match notify.tpl.<category>.<name> from the template registry | VALIDATION_FAILED |
| V07 | subscribe, unsubscribe and list are signed (classrup/relay-request/v1) by a device key of userDid that F16.S02.M02 reports active at the relay receipt time, the signing time is not after the key's revocationEffectiveFrom, and vapidKeyId is held in RelayKeyStorePort | UNAUTHENTICATED |
| V08 | RateLimitPort.consume (F12.S03.M03) allows the call - 10 subscribe calls per user per day per relay and 60 list calls per user per hour | RATE_LIMITED |
| V09 | the payload has exactly the keys of one form - sealed {v, urg, s} with at most 10 boxes, one per target deviceKeyId with an active subscription; hook {v, urg, tpl, ref?, ck?}; digest {v, urg, tpl, n} | VALIDATION_FAILED |
| V10 | at send time the endpoint host is resolved, the connection is pinned to a resolved address that is not private, loopback, link-local or unique-local, and redirects are not followed | NOTIFY_PUSH_ENDPOINT_REJECTED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-104-09.T01 | unit | PS-104-01.R01, PS-104-01.R02, PS-104-02.R01 | subscribe with valid and malformed sealed bodies | valid stored with secret encrypted and pushOrigin set; malformed refused VALIDATION_FAILED; secrets absent from every query |
| TEST-PS-104-09.T02 | unit | PS-104-02.R03, PS-104-02.R01 | each rule V01 to V10 violated in turn including an off-allowlist origin, private-IP endpoint and 11th subscription | documented error code returned and nothing stored or sent |
| TEST-PS-104-09.T03 | contract | PS-104-01.R03, PS-104-02.R02, PS-104-04.R01, PS-104-09.R02, PS-104-09.R03 | send a sealed, a hook and a digest payload; run every command, query and event of this module | fake push service decrypts exactly the keys of each form; headers TTL, Urgency, Topic and Content-Encoding aes128gcm; VAPID JWT valid ES256 with exp ≤ 12 h; inputs, outputs and event payloads validate against the schema registry entries |
| TEST-PS-104-09.T16 | contract | PS-104-02.R04, PS-104-07.R01 | property over 10 000 collapse tags of 1..64 valid characters and two users with the same tag | every Topic matches ^[A-Za-z0-9_-]{1,32}$; the two users' Topics differ; no Topic equals or contains the tag |
| TEST-PS-104-09.T20 | contract | PS-104-04.R05, PS-104-02.R01 | enable with privacy.consent.check returning not granted, and with the channel consent not yet registered; 11th subscribe call in a day | PRECONDITION_FAILED before any browser prompt; RATE_LIMITED from RateLimitPort |

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
