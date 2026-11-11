# PS-107-05 — Authorization and capabilities: Channel opt-in/opt-out

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M03 Channel opt-in/opt-out](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/opt` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-107-05.R01** Vault policy lets only the local principal grant, withdraw or apply relay changes to its own channel consents.
- **PS-107-05.R02** Relay policy lets an active device key of the user register its owner's statements and list its changes; unsubscribe is open to a holder of a valid token and can only withdraw, never grant.
- **PS-107-05.R03** Relay operators cannot create a consent for a user; they can only withdraw it under their hosting policy through RelayWithdrawalPort, recorded with via relay_policy in a relay-signed receipt.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| notify.channel.opt_in | local principal | vault policy; privacy.consent.check granted for the matching purpose and relay |
| notify.channel.opt_out | local principal | consent.userDid is the local principal |
| notify.channel.apply_relay_change | local principal | vault sync routine of the local principal; receipt verified by V08 |
| notify.channel.register | registered relay device | relay policy; request and statement signed by an active device key of the same user; relay offers the channel |
| notify.channel.unsubscribe | anonymous | relay public by token; withdraw only; 10 calls per minute per IP prefix |
| notify.channel.expire | relay service | relay internal scheduler only |
| notify.channel.read_changes | registered relay device | active device key of the consenting user; only that user's receipts |
| notify.channel.read_own | local principal | consent.userDid is the local principal |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-107-09.T06 | abuse | PS-107-05.R01, PS-107-05.R02, PS-107-05.R03 | forged opt-in from another user's key; unsubscribe attempting to grant; operator trying to create a consent | rejected in each case; operator withdrawal produces a relay_policy receipt |

## Dependencies

Module depends on: F10.S01.M01, F07.S01.M01, F07.S02.M01, F11.S01.M01, F11.S03.M01, F15.S01.M01, F15.S02.M01, F16.S02.M02, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
