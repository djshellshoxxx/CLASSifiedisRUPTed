# PS-104-07 — Privacy, retention and abuse: Web push delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M01 Web push delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/push` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-104-07.R01** Payloads are content-free and encrypted end to end to the browser per RFC 8291, so the push service sees only metadata (endpoint, size, time, Topic) and the relay operator sees reference and template key only.
- **PS-104-07.R02** The push endpoint is a P3 bearer secret stored encrypted and erased at expiry or revocation; the push service provider can link the endpoint to the browser vendor, which the explainer states.
- **PS-104-07.R03** Pseudonymity is not anonymity because the relay links a DID to a push endpoint, and users choose the relay.

## Specification

**Data classification**
- PushSubscription: P3 (endpoint, keys) at the selected relay only.
- Push payload: content-free reference, template key, collapse key; P2 reference semantic.
- VAPID private key: P4 relay secret, never exported.

**Retention**
- Active subscriptions: RET-STANDARD until revoked or expired; secrets erased at the terminal transition.
- Send logs and delivery counters: RET-SHORT (30 days) without endpoint.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Push service or network observer reads alert content | content-free payload and RFC 8291 aes128gcm encryption; tests assert absence of text fields |
| T02 | Subscription endpoint theft lets an attacker spam a browser | endpoint is stored encrypted, erased on expiry, sends require the relay VAPID signature so the endpoint alone cannot send |
| T03 | Abuse of the relay as a push spammer | send is internal and gated; consent and category checks; 120 dispatches per user per hour |
| T04 | VAPID key compromise | key rotation procedure with new vapidKeyId, old subscriptions expire and are re-created, operator alert on 401 or 403 spikes |
| T05 | SSRF through attacker-chosen endpoint | https-only, host must resolve to public addresses, redirects not followed, 10 s timeout, allowlist of known push service domains optional per relay |
| T06 | Relay learns user to endpoint mapping | disclosed, user selects the relay, self-hosting is supported, subscription deleted on revocation |

**Abuse controls**
- Per-user limit of 10 subscriptions and 10 subscribe calls per day; send rate limited by the gate.
- Relay operators can block device keys or users on that relay only.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-104-09.T10 | abuse | PS-104-07.R01, PS-104-07.R02, PS-104-07.R03 | inspect database, logs, events and metrics; SSRF endpoint attempts to 169.254.169.254 and redirects | no endpoint or payload outside encrypted storage; SSRF blocked |
| TEST-PS-104-09.T11 | abuse | PS-104-07.R03, PS-104-06.R02 | VAPID rejected 401 | operator alert raised, no subscription expired, sends paused 15 minutes |

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
