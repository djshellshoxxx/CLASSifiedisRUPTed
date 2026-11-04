# PS-108-05 — Authorization and capabilities: Quiet-hours enforcement

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M01 Quiet-hours enforcement](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/quiet` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-108-05.R01** Relay policy lets only relay-internal hooks (mailbox arrival, hosted auction events) and registered devices of the same user call dispatch for that user; arbitrary clients cannot trigger pushes for others.
- **PS-108-05.R02** Vault policy lets the local principal's own event consumers dispatch local alerts; the gate never reads message content because none is passed.
- **PS-108-05.R03** Users read their own deferred counts; relay operators can see counts and references of consenting users as part of operating the relay, which is disclosed.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| notify.notification.dispatch | relay service, registered relay device | relay policy; caller is a relay hook or a device key of the target user; consent and matrix checked by the gate |
| notify.notification.release | relay service | internal scheduler only |
| notify.notification.read_deferred | local principal | owner of the deferred items, or device key of the owner at the relay |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-108-09.T08 | abuse | PS-108-05.R01, PS-108-05.R02, PS-108-05.R03 | dispatch by a stranger for another user; replay of a hook call; operator reads deferred records | FORBIDDEN or NOT_FOUND; one send; records content-free |

## Dependencies

Module depends on: F13.S02.M02, F13.S02.M03, F13.S02.M04, F13.S01.M01, F13.S01.M02, F13.S01.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
