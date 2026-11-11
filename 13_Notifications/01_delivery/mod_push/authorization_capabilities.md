# PS-104-05 — Authorization and capabilities: Web push delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M01 Web push delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/push` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-104-05.R01** Relay policy lets only a device key of the user that F16.S02.M02 reports active at the relay receipt time subscribe, unsubscribe and list that user's subscriptions, and only after a granted push consent is registered at that relay.
- **PS-104-05.R02** The internal send command is callable only by the gate of F13.S02.M01 inside the relay; no external client can trigger a send directly.
- **PS-104-05.R03** The VAPID public key is public; the private key never leaves RelayKeyStorePort and is never logged, and rotation is a relay operator action.
- **PS-104-05.R04** A revoked device key loses its subscriptions and every later request it signs is refused with UNAUTHENTICATED, including requests signed after its revocationEffectiveFrom that arrive late.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| notify.push.enable | local principal | vault policy; privacy.consent.check notify_push granted for relayId; local push ChannelConsent registered; browser permission granted |
| notify.push.disable | local principal | vault policy; push target belongs to this vault |
| notify.push.read_local | local principal | vault policy; own push targets only |
| notify.push.subscribe | registered relay device | relay policy; request signed by a device key of userDid active per F16.S02.M02 at receipt time; granted unexpired push consent registered here; fewer than 10 subscriptions |
| notify.push.unsubscribe | registered relay device | signing key is an active device key of subscription.userDid; another user's subscription answers NOT_FOUND (ERR-4) |
| notify.push.send | relay service | relay internal; caller is the F13.S02.M01 gate |
| notify.push.read_key | anonymous | relay public read; 60 requests per minute per IP prefix through RateLimitPort |
| notify.push.read_own | registered relay device | active device key of the subscription owner |
| notify.push.rotate_key | relay operator | relay operator role from F16.S01.M01 role assignments on this relay only |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-104-09.T07 | abuse | PS-104-05.R01, PS-104-05.R02, PS-104-05.R03 | send called by an external client; subscribe signed by an unknown key; list by another user; inspect the relay database and key store | refused or NOT_FOUND; no private key or endpoint exposed; VAPID private key only in RelayKeyStorePort |
| TEST-PS-104-09.T17 | abuse | PS-104-05.R04, PS-104-03.R03 | device key K is revoked in F16.S02.M02; K then signs subscribe, list and unsubscribe; a request signed before revocationEffectiveFrom arrives late | the subscription created by K is revoked; every later request refused UNAUTHENTICATED; the late pre-revocation request is refused because the key is no longer active |
| TEST-PS-104-09.T19 | integration | PS-104-01.R05, PS-104-04.R05, PS-104-05.R03 | operator rotates the VAPID key; DeletionPort plan and purge, export section and retention purge with F10 registry doubles | new key registered with purpose vapid in F16.S02.M02; private key never leaves RelayKeyStorePort; purge removes targets and calls PushManager.unsubscribe; section notify.push exported; targets purged 30 days after endedAt |

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M02, F16.S02.M01, F11.S01.M03, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
