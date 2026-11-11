# PS-106-03 — Workflow state machine: In-app notification preferences

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M04 In-app notification preferences](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/in` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-106-03.R01** The matrix is plain settings without a lifecycle; every cell is edited in place with a revision counter and no cell is ever deleted.
- **PS-106-03.R02** The enforced transition rules are the locks, which refuse any change that would turn security in-app off or activity in-app on.
- **PS-106-03.R03** Mirror status per relay and channel moves through local committed, prepared, transport acknowledged (HTTP 2xx) and peer accepted (relay acceptance signature over this statement's cid as the applied head), never claims more than that acceptance, and a stale or superseded statement stays below peer accepted.

## Specification

**Note:** Settings record with no lifecycle states; the locks and invariants are enforced by validation rules V02 and V07, and mirror progress per relay and channel is tracked by the F15.S01.M01 sync outbox, where stale and conflict are outcomes below transport_acknowledged.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-106-09.T03 | unit | PS-106-03.R01, PS-106-03.R02 | edit cells across categories and channels | edits in place with revision increments; no cell deleted; locks held |
| TEST-PS-106-09.T04 | integration | PS-106-03.R03, PS-106-06.R01 | edit while relay down then relay up | mirror shows local_committed, prepared, transport_acknowledged and peer_accepted only after the acceptance signature over its cid |

## Dependencies

Module depends on: F13.S02.M03, F11.S01.M01, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
