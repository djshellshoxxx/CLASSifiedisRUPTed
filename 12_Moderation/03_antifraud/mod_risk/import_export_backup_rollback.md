# PS-100-10 — Import, export, backup and rollback: Risk scoring

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M01 Risk scoring](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/risk` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-100-10.R01** Assessments are derived and excluded from user exports and backups, and are recomputed from signals after import or restore.
- **PS-100-10.R02** The model formula and thresholds are exported with relay configuration and validated on import against allowed ranges.
- **PS-100-10.R03** Model changes are versioned and run in shadow mode for 7 days before activation.

## Specification

- **export:** Not exported (derived); relay configuration export contains model version and thresholds.
- **import:** Assessments are not imported; after signals import, the daily sweep recomputes them; thresholds import only within allowed ranges.
- **backup:** Derived data excluded from backup (CTR-IOX-001 IOX-3 and IOX-6); restore recomputes.
- **migration rollback:** A new model version runs in shadow for 7 days with comparison metrics; rollback restores the previous version by configuration; stored rows with older versions stay readable.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-100-09.T13 | integration | PS-100-10.R01, PS-100-10.R02, PS-100-10.R03 | export, import, backup restore | assessments excluded from export and recomputed after restore with identical results |

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
