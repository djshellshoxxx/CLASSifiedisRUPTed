# PS-108-10 — Import, export, backup and rollback: Quiet-hours enforcement

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M01 Quiet-hours enforcement](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/quiet` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-108-10.R01** Deferred records are operational and short-lived, so a user's vault export contains no deferred items, only the counts since the last export in diagnostics.
- **PS-108-10.R02** Relay restore from backup drops deferred records older than 24 hours and rechecks the registered consent before any release.
- **PS-108-10.R03** Schema changes follow expand and contract; new channels or categories are additive and ignored by older relays.

## Specification

- **export:** Section notify.deferred in classrup-export/v1 through ExportSectionPort with counts per category and channel only (schema classrup.notify.deferred/v1 counts projection).
- **import:** Nothing is imported; deferred state is rebuilt from new events.
- **backup:** Relay SQLite backup (CTR-IOX-001 IOX-3, IOX-7) may contain deferred relay rows; on restore all rows older than 24 h are dropped and consent is rechecked before release.
- **migration rollback:** Additive fields only in v1; rollback is safe because deferred rows live at most 24 hours and unknown fields are ignored.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-108-09.T14 | integration | PS-108-10.R01, PS-108-10.R02, PS-108-10.R03 | export deferred counts, restore relay from backup | deferred records past expiry are dropped on restore and none are sent twice |

## Dependencies

Module depends on: F13.S02.M02, F13.S02.M03, F13.S02.M04, F13.S01.M01, F13.S01.M02, F13.S01.M03, F16.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F16.S02.M02, F07.S02.M01, F15.S01.M01, F12.S03.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
