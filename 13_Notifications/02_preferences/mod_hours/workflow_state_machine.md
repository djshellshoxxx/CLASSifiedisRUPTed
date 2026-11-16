# PS-105-03 — Workflow state machine: Quiet-hours schedule

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M02 Quiet-hours schedule](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/hours` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-105-03.R01** The schedule is a settings record without lifecycle states; it is replaced as a whole on each save with an incremented revision.
- **PS-105-03.R02** Enabled and disabled are a flag, not a state machine, and disabling never deletes the windows.
- **PS-105-03.R03** Mirror progress to each relay moves forward through local committed, prepared, transport acknowledged and peer accepted and the UI shows only the reached stage.

## Specification

**Note:** Settings record with no lifecycle states; enabled is a boolean flag and mirror progress is tracked by the sync outbox (CTR-IDM-001 IDM-7).

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-105-09.T06 | property | PS-105-02.R02, PS-105-03.R01 | random instants 2020 to 2100 for 12 zones and random valid schedules | isQuiet equals reference; quietEndsAt is the first instant where isQuiet is false; never throws |
| TEST-PS-105-09.T08 | integration | PS-105-04.R03, PS-105-03.R02 | channel opted in and opted out events delivered | schedule mirrored to the consenting relay and deletion requested when consent ends |
| TEST-PS-105-09.T10 | integration | PS-105-06.R01, PS-105-06.R02, PS-105-06.R03, PS-105-03.R03 | replay seq 3 after seq 5; relay down during save | stale ignored; local evaluation unaffected; sync states advance prepared to transport acknowledged to peer accepted |

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
