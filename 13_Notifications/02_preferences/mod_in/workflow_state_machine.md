# PS-106-03 — Workflow state machine: In-app notification preferences

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M04 In-app notification preferences](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/in` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-106-03.R01** The matrix is plain settings without a lifecycle; every cell is edited in place with a revision counter and no cell is ever deleted.
- **PS-106-03.R02** The only enforced transition rule is the security lock, which refuses any change that would turn security in-app off.
- **PS-106-03.R03** Mirror status per relay moves forward through local committed, prepared, transport acknowledged and peer accepted and never claims more than the relay receipt.

## Specification

**Note:** Settings record with no lifecycle states; invariants and the security lock are enforced by validation rules V02 and V07.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-106-09.T03 | unit | PS-106-03.R01, PS-106-03.R02 | edit cells across categories and channels | edits in place with revision increments; no cell deleted; security lock held |
| TEST-PS-106-09.T04 | integration | PS-106-03.R03, PS-106-06.R01 | edit while relay down then relay up | mirror shows local_committed, prepared, transport_acknowledged in order, never ahead |

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
