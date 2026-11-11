# PS-097-10 — Import, export, backup and rollback: Spam detection

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M02 Spam detection](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/spam` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-097-10.R01** The fingerprint index is derived data and is excluded from user exports and from backups.
- **PS-097-10.R02** Operator threshold configuration is exported with relay configuration and validated on import against allowed ranges.
- **PS-097-10.R03** Heuristic changes are versioned in rulesVersion and old versions stay readable for audit for 180 days.

## Specification

- **export:** No user data is exported; relay configuration export contains thresholds and rulesVersion.
- **import:** Thresholds import only within allowed ranges; out-of-range values are rejected with VALIDATION_FAILED.
- **backup:** Index excluded from backup (rebuilt); configuration covered by relay backup (CTR-IOX-001 IOX-3).
- **migration rollback:** A new rulesVersion runs in shadow mode for 7 days comparing scores before activation; rollback restores the previous version by configuration without data migration.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-097-09.T13 | integration | PS-097-10.R01, PS-097-10.R02, PS-097-10.R03 | export, import and backup restore | index absent from export and rebuilt after restore; configuration round-trips |

## Dependencies

Module depends on: F12.S03.M02, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
