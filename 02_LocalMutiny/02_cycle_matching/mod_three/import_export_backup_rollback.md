# PS-020-10 — Import, export, backup and rollback: Three-party cycles

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M01 Three-party cycles](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/three` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-020-10.R01** The module owns no records, so export contains nothing of its own; the profile version is stored inside each exported CycleSuggestion explanation metadata.
- **PS-020-10.R02** Imported suggestions keep the profile version they were computed with and are re-verified with the importing vault's profile.
- **PS-020-10.R03** Profile version changes follow semantic versions and a rollback restores the previous constants without data migration.

## Specification

- **export:** Nothing of its own; profile version p3.2 is carried in exported CycleSuggestion records of F02.S02.M03.
- **import:** No import; imported suggestions are re-verified with the local effective profile on first open.
- **backup:** No data to back up; tenant overrides are part of tenant settings backups (F15.S04.M03).
- **migration rollback:** Profile constants ship with the release; rollback restores the previous constants and previously generated suggestions keep their recorded version.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-020-09.T12 | integration | PS-020-10.R01, PS-020-10.R02, PS-020-10.R03 | export, import, rollback | no module records exported; profile version of imported suggestions retained |

## Dependencies

Module depends on: F02.S02.M03, F02.S02.M04, F02.S02.M05, F02.S04.M02, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
