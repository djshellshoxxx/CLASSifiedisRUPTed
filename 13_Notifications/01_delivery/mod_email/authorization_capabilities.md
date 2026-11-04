# PS-102-05 — Authorization and capabilities: Email delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M02 Email delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/email` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-102-05.R01** Relay policy lets only a registered device key of the user add, remove and read its own address, and only with granted email consent.
- **PS-102-05.R02** Verification is open to the holder of the unguessable token; send and bounce handling are internal to the relay and cannot be called by clients.
- **PS-102-05.R03** Relay operators can access ciphertext of addresses only through the transport adapter at send time; the UI states that the operator can read the address.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| notify.email.add | registered relay device | relay policy; request signed by a device key of the user; granted unexpired email consent; one address per user |
| notify.email.verify | anonymous | relay public by unguessable token; 10 attempts per minute per IP |
| notify.email.remove | registered relay device | address.userDid matches the signing device's user |
| notify.email.send | relay service | relay internal; caller is the F13.S02.M01 gate |
| notify.email.report_bounce | relay service | relay internal; transport adapter only |
| notify.email.read_own | registered relay device | device key of the address owner |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-102-09.T07 | abuse | PS-102-05.R01, PS-102-05.R02, PS-102-05.R03 | add by unknown key; verify with guessed token; external call to send; operator query for cleartext | refused or masked; no cleartext available except in adapter at send time |

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
