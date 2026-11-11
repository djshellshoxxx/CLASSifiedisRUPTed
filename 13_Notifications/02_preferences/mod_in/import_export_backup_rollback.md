# PS-106-10 — Import, export, backup and rollback: In-app notification preferences

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M04 In-app notification preferences](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/in` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-106-10.R01** A user's vault export contains their matrix cells with revisions.
- **PS-106-10.R02** Import validates categories and the locks, keeps unknown categories in the other bucket with defaults and does not mirror to relays without a fresh user action.
- **PS-106-10.R03** Schema changes follow expand and contract; new categories are additive and default to in-app on and push and email off.

## Specification

- **export:** Section notify.preferences in classrup-export/v1 through ExportSectionPort; one line per category (schema classrup.notify.preference/v1); relay copies are not exported.
- **import:** Cells validated; security inApp forced true and activity inApp forced false; existing newer revisions kept; the imported vault starts new mirror chains for its device key and mirrors only after the user opens the settings and confirms.
- **backup:** The vault export is the backup (IOX-6); relay copies are operational data restored with relay SQLite backup (IOX-3, IOX-7) and deleted on restore when no consent for the channel remains registered.
- **migration rollback:** Additive categories only; defaultsVersion 2 adds activity with push on; rollback is safe because older apps show unknown categories as Other with defaults and do not delete them.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-106-09.T13 | integration | PS-106-10.R01, PS-106-10.R02, PS-106-10.R03, PS-106-01.R05 | export, import into fresh vault with an unknown category, restore relay from backup | matrix round trips; unknown category kept in the other bucket with defaults and never mirrored |

## Dependencies

Module depends on: F13.S02.M03, F11.S01.M01, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
