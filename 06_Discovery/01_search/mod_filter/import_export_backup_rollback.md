# PS-044-10 — Import, export, backup and rollback: Search filters

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M03 Search filters](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/filter` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-044-10.R01** The library owns no data, so it has no export section; filters travel inside saved searches exported by F06.S01.M02.
- **PS-044-10.R02** Imported filters are revalidated with the current library and rejected if they use unknown keys.
- **PS-044-10.R03** Filter schema changes are additive within v1 and breaking changes use a new major version with a migration function.

## Specification

- **export:** Not applicable; filters are exported as part of discovery.saved_searches by F06.S01.M02.
- **import:** Filters inside imported saved searches are revalidated by validateFilter; invalid ones cause that saved search to be reported and skipped.
- **backup:** No data; covered by vault export and relay backups of the owning modules.
- **migration rollback:** Additive optional keys only; a new major adds a registered migration vN to vN+1 per CTR-SCH-001 SCH-4 and rollback keeps the previous major readable for 180 days.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-044-09.T13 | unit | PS-044-10.R01, PS-044-10.R02, PS-044-10.R03 | load a v1 filter stored inside a saved search export | parsed unchanged; unknown key rejected on import |

## Dependencies

Module depends on: F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-PRV-001, CTR-MNY-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
