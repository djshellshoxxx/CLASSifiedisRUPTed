# PS-106-05 — Authorization and capabilities: In-app notification preferences

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M04 In-app notification preferences](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/in` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-106-05.R01** Vault policy lets only the local principal edit its matrix and lets local notification modules call check.
- **PS-106-05.R02** Relay policy lets an active device key mirror its owner's column for a channel only where the relay holds a registered granted consent of that user for that channel.
- **PS-106-05.R03** Relay operators and other users cannot read or edit a user's in-app column; the relay-side resolve query is internal to the relay's dispatch gate.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| notify.preference.set | local principal | vault policy; owner of the matrix |
| notify.preference.read_own | local principal | owner of the matrix |
| notify.preference.check | local principal | in-process call from F13.S02.M01 or F13.S01.M03 in the unlocked vault |
| notify.preference.mirror | registered relay device | relay policy; statement and request signed by an active device key of the user; granted consent for the statement's channel registered at this relay |
| notify.preference.resolve | relay service | relay internal; used by the hook dispatches of F13.S02.M01 only |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-106-09.T07 | abuse | PS-106-05.R01, PS-106-05.R02, PS-106-05.R03 | forged mirror from another key; mirror for email at R without email consent; third party read | rejected; operator cannot read the in-app column |
| TEST-PS-106-09.T09 | abuse | PS-106-07.R01, PS-106-07.R02, PS-106-05.R02 | inspect mirror statements and relay storage at R (push only) and R2; app update with a new category | R holds only push booleans and no email flags; R2 one column per channel; no in-app column or other bucket anywhere; user choices preserved |

## Dependencies

Module depends on: F13.S02.M03, F11.S01.M01, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
