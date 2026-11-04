# PS-106-10 — Import, export, backup and rollback: In-app notification preferences

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M04 In-app notification preferences](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/in` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-106-10.R01** A user's vault export contains their matrix cells with revisions.
- **PS-106-10.R02** Import validates categories and the security lock, keeps unknown categories with defaults and does not mirror to relays without a fresh user action.
- **PS-106-10.R03** Schema changes follow expand and contract; new categories are additive and default to in-app on and push and email off.

## Specification

- **export:** Section notify.preferences in classrup-export/v1; 7 lines per user (schema classrup.notify.preference/v1).
- **import:** Cells validated; security inApp forced true; existing newer revisions kept; relay mirror re-sent only after the user opens the settings and confirms.
- **backup:** The vault export is the backup (IOX-6); relay snapshots are operational data restored with relay SQLite backup (IOX-3, IOX-7).
- **migration rollback:** Additive categories only; rollback is safe because older apps show unknown categories as Other with defaults and do not delete them.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-106-09.T13 | integration | PS-106-10.R01, PS-106-10.R02, PS-106-10.R03 | export, import into fresh vault, restore relay from backup | matrix round trips; unknown categories kept with defaults |

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
