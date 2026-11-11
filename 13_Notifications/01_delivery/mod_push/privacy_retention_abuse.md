# PS-104-07 — Privacy, retention and abuse: Web push delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M01 Web push delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/push` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-104-07.R01** Payloads are content-free and RFC 8291 encrypted to the browser, so the push service sees only the endpoint, size, time and an opaque per-subscription Topic, and for vault-originated alerts the relay sees only a sealed box it cannot open.
- **PS-104-07.R02** The push endpoint and keys form a P2 service copy for the single selected relay, sealed in transit, encrypted at rest and erased at expiry, revocation or registered withdrawal; the push service provider can link the endpoint to the browser vendor, which the explainer states.
- **PS-104-07.R03** Pseudonymity is not anonymity because the relay links a DID to a push endpoint, and users choose the relay.
- **PS-104-07.R04** Endpoints must be on the push-service origin allowlist and are re-resolved and re-checked on every send, so a user-chosen endpoint can neither reach internal addresses nor pause sending for other users.

## Specification

**Data classification**
- PushSubscription relay copy: P2 for the selected relay only (disclosed service copy under the notify_push channel consent, PRV-5 participant rule; channel-identifier amendment requested from F10); endpoint, keys and topic key encrypted at rest.
- PushSubscription vault target: P3 in the vault; contains no endpoint or keys; exported only in the user's own export.
- Push payload: content-free; sealed box opaque to relay and push service, or hook data the relay already holds; Topic opaque per subscription.
- VAPID private key: P4 relay secret in RelayKeyStorePort, never exported; public key P0, registered in F16.S02.M02.

**Retention**
- Relay subscriptions: RET-STANDARD until revoked or expired; secrets erased at the terminal transition; rows purged 30 days later.
- Vault push targets: RET-STANDARD; purged 30 days after disable or expiry through RetentionPurgePort kind notify.push_target.
- Send logs and delivery counters: RET-SHORT (30 days) without endpoint, topic or collapse data.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Push service or network observer reads alert content | content-free payload, sealed box for vault alerts and RFC 8291 aes128gcm encryption; tests assert absence of text fields |
| T02 | Subscription endpoint theft lets an attacker spam a browser | endpoint stored encrypted, erased on expiry, sends require the relay VAPID signature so the endpoint alone cannot send |
| T03 | Abuse of the relay as a push spammer | send is internal and gated; consent and category checks; 120 dispatches per user per hour through RateLimitPort |
| T04 | VAPID key compromise | RelayKeyStorePort rotation with a new vapidKeyId, revocation in F16.S02.M02, bound subscriptions expire and vaults re-subscribe, operator alert on multi-user 401 or 403 patterns |
| T05 | SSRF and DNS rebinding through an attacker-chosen endpoint | origin allowlist by default, address resolved and pinned on every send, private, loopback, link-local and unique-local ranges refused, redirects not followed, 10 s timeout |
| T06 | Relay learns user to endpoint mapping | disclosed in the explainer, user selects the relay, self-hosting supported, copy erased on registered withdrawal |
| T07 | A user registers an endpoint answering 401 or 403 to pause push for everyone | rejection counts against that subscription only; origin pause needs 5 distinct users on an allowlisted origin within 5 minutes |
| T08 | Collapse keys in the Topic header link users at the push service | Topic is an HMAC under a per-subscription key of an opaque collapse tag, so two users never share a Topic |
| T09 | A stolen device key keeps its subscription or re-subscribes | security.key.revoked revokes subscriptions created by the key and V07 refuses its later requests |

**Abuse controls**
- Per-user limit of 10 subscriptions and 10 subscribe calls per day, 60 list calls per hour, 60 key reads per minute per IP prefix, all through RateLimitPort (F12.S03.M03); send rate limited by the gate.
- Relay operators can block device keys or users on that relay only and override the push-service origin allowlist.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-104-09.T10 | abuse | PS-104-07.R01, PS-104-07.R02, PS-104-07.R03, PS-104-07.R04 | inspect database, logs, events and metrics; endpoint at 169.254.169.254; an allowlisted host re-resolving to 10.0.0.5 at send time (DNS rebinding); a redirecting endpoint | no endpoint, topic key or payload outside encrypted storage; each blocked endpoint refused with NOTIFY_PUSH_ENDPOINT_REJECTED without a connection |
| TEST-PS-104-09.T11 | abuse | PS-104-06.R04, PS-104-07.R04 | an attacker endpoint returns 401 to every send; then subscriptions of 5 distinct users on one allowlisted origin return 403 within 5 minutes | first case only the attacker's subscription accrues failures and others keep sending; second case operator alert and a 15-minute pause for that origin only |
| TEST-PS-104-09.T16 | contract | PS-104-02.R04, PS-104-07.R01 | property over 10 000 collapse tags of 1..64 valid characters and two users with the same tag | every Topic matches ^[A-Za-z0-9_-]{1,32}$; the two users' Topics differ; no Topic equals or contains the tag |
| TEST-PS-104-09.T21 | e2e | PS-104-07.R02, PS-104-07.R03 | open the permission explainer and the push settings before and after enabling | text names the relay that receives the endpoint, says the push service sees only an opaque topic and can link the endpoint to the browser vendor, and that the relay links the pseudonym to the endpoint |

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M02, F16.S02.M01, F11.S01.M03, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
