# PS-049-10 — Import, export, backup and rollback: Proximity queries

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M03 Proximity queries](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/proximity` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-049-10.R01** The module owns no user data; nothing is exported, and the vault keeps no proximity history.
- **PS-049-10.R02** Relay policy values are part of relay configuration and are restored with relay backups; counters are never backed up.
- **PS-049-10.R03** Policy value changes are versioned and a rollback restores the previous version.

## Specification

- **export:** Not applicable; no user data is owned.
- **import:** Not applicable; relay policy values are configuration, imported by operators through F15.S04.
- **backup:** Relay policy values are covered by relay configuration backups (IOX-7); counters are ephemeral and excluded.
- **migration rollback:** Policy version increments on every change and rollback selects the previous version; the allowed radius set and the 5 km minimum are constants that change only with a new major of F06.S02.M01.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-049-09.T14 | integration | PS-049-10.R01, PS-049-10.R02, PS-049-10.R03 | export and restore of vault and relay | no proximity data exists in exports; policy values restored from relay configuration backup |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, F06.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
