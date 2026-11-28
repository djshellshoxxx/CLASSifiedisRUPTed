# PS-115-10 — Import, export, backup and rollback: PWA install

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M03 PWA install](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/install` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-115-10.R01** Install state and dismissal counters are device preferences and are excluded from the vault export.
- **PS-115-10.R02** Reinstalling the app on the same origin keeps the vault in IndexedDB; uninstalling or clearing site data deletes it, which the install explanation states before the first export reminder.
- **PS-115-10.R03** Rolling back to an earlier build is a static redeploy and needs no data migration in this module.

## Specification

- **export:** No section in classrup-export/v1; install preferences are not user data. The Settings > App page links to Export vault (F10.S01.M03).
- **import:** Not applicable.
- **backup:** Not backed up. The vault export is the user's backup (CTR-IOX-001 IOX-6); the explanation text shown at install recommends exporting at least every 30 days, or every 7 days when persistent storage is denied.
- **migration rollback:** classrup.install.v1 carries a version field; unknown versions are ignored and replaced with defaults. Manifest id is never changed so that rollback or re-release keeps the installed app identity. A rollback build carries a higher releaseSeq than the build it replaces so V07 accepts it.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-115-09.T15 | integration | PS-115-10.R01, PS-115-10.R03 | roll back to build A and reset app settings | A installs and runs, preferences cleared on reset, vault untouched, export bundle contains no install state |
| TEST-PS-115-09.T17 | e2e | PS-115-10.R02 | install, create a vault, uninstall the app (site data kept) and reinstall on the same origin; then clear site data | after reinstall the IndexedDB vault marker of F15.S01.M01 is present and the vault opens; after clearing site data the data-loss warning appears |

## Dependencies

Module depends on: F15.S01.M01, F15.S01.M02, F16.S02.M03, CTR-UX-001, CTR-OBS-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
