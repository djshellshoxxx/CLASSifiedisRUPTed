# PS-105-10 — Import, export, backup and rollback: Quiet-hours schedule

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M02 Quiet-hours schedule](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/hours` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-105-10.R01** A user's vault export contains their schedule including the tzdata version.
- **PS-105-10.R02** Import validates the time zone against the target build's tzdata and refuses unknown zones, asking the user to choose another.
- **PS-105-10.R03** Schema changes follow expand and contract; new window fields are additive and old windows keep their meaning.

## Specification

- **export:** Section notify.quiet_hours in classrup-export/v1 through ExportSectionPort; one line per QuietHoursSchedule (schema classrup.notify.quiet_hours/v1); relay copies are not exported.
- **import:** Time zone and windows re-validated; unknown zones are rejected and the schedule imports disabled; the imported vault starts a new mirror chain for its own device key and mirrors only after user confirmation.
- **backup:** The vault export is the backup (IOX-6); relay copies are operational data covered by relay SQLite backup (IOX-3, IOX-7) and are deleted on restore when no consent of the user remains registered.
- **migration rollback:** Additive fields only in v1; a tzdata release changes results only for future instants and is recorded; rollback to an older build keeps the stored tzdataVersion and re-evaluates with the older data and its canonical-zone table.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-105-09.T14 | integration | PS-105-10.R01, PS-105-10.R02, PS-105-10.R03 | export, import into fresh vault, restore relay from backup, and import with newer tzdata | schedule round trips; unknown time zone rejected with the user prompted |

## Dependencies

Module depends on: F13.S02.M03, F11.S01.M01, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
