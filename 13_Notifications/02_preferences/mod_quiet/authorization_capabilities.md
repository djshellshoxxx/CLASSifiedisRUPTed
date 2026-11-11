# PS-108-05 — Authorization and capabilities: Quiet-hours enforcement

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M01 Quiet-hours enforcement](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/quiet` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-108-05.R01** Relay policy lets only in-process relay hooks and active device keys of the target user call dispatch, cancel and list for that user; a valid device key of another principal is refused with FORBIDDEN and an unsigned or revoked-key request with UNAUTHENTICATED.
- **PS-108-05.R02** Vault policy lets the local principal's routing consumers dispatch through NotificationDispatchPort and the vault sweep release local alerts; the gate never reads message content because none is passed.
- **PS-108-05.R03** Users read their own deferred counts; relay operators can see counts, timing and hook categories of consenting users but never the contents of sealed boxes, which is disclosed.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| notify.notification.dispatch | local principal, registered relay device, relay service | vault mode: routing consumers of the unlocked local principal (os_alert decisions and vault-originated push or email requests); sealed mode: active device key of userDid per F16.S02.M02; hook mode: in-process relay hook; consent and matrix checked by the gate |
| notify.notification.release | local principal, relay service | vault sweep inside the running vault of the local principal; relay internal scheduler |
| notify.notification.cancel | registered relay device | active device key of userDid; only items of that user |
| notify.notification.read_deferred | local principal, registered relay device | owner of the deferred items in the vault; at the relay an active device key of the owner, counts only |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-108-09.T08 | abuse | PS-108-05.R01, PS-108-05.R02, PS-108-05.R03 | dispatch and cancel signed by a valid device key of user W for user U; replay of a hook call; operator reads relay deferred records | both W requests return exactly FORBIDDEN and nothing about U is revealed; one send for the replay; records hold no readable content |

## Dependencies

Module depends on: F13.S02.M02, F13.S02.M03, F13.S02.M04, F13.S01.M01, F13.S01.M02, F13.S01.M03, F08.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F16.S02.M02, F07.S02.M01, F15.S01.M01, F12.S03.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
