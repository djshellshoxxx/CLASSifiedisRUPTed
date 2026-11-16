# PS-104-05 — Authorization and capabilities: Web push delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M01 Web push delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/push` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-104-05.R01** Relay policy lets only a registered device key of the user subscribe, unsubscribe and list that user's subscriptions, and only after push consent is granted.
- **PS-104-05.R02** The internal send command is callable only by the gate of F13.S02.M01 inside the relay; no external client can trigger a send directly.
- **PS-104-05.R03** The VAPID public key is public; the private key never leaves the relay key store and is never logged.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| notify.push.enable | local principal | vault policy; push consent granted at the chosen relay; browser permission granted |
| notify.push.subscribe | registered relay device | relay policy; request signed by a device key of the user; granted unexpired push consent; fewer than 10 subscriptions |
| notify.push.unsubscribe | registered relay device | subscription.userDid matches the signing device's user |
| notify.push.send | relay service | relay internal; caller is the F13.S02.M01 gate |
| notify.push.read_key | anonymous | relay public read; 60 requests per minute per IP |
| notify.push.read_own | registered relay device | device key of the subscription owner |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-104-09.T07 | abuse | PS-104-05.R01, PS-104-05.R02, PS-104-05.R03 | send called by external client; subscribe signed by unknown key; list by another user; inspect key store | refused; no private key or endpoint exposed |

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
