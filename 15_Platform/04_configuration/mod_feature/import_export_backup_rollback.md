# PS-123-10 — Import, export, backup and rollback: Feature registry

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M01 Feature registry](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/feature` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-123-10.R01** The registry is application code and data, not user data, and is excluded from every export and backup.
- **PS-123-10.R02** Rolling back a release restores that release's registry together with its code, so no migration is needed.
- **PS-123-10.R03** Imports of vault data from a release with unknown modules keep those records read-only and listed, never dropped.

## Specification

- **export:** Not exported; the registry hash and version are recorded in the export manifest for diagnostics (CTR-IOX-001 IOX-1 manifest field modules[]).
- **import:** On import, module identifiers in the bundle are checked against the registry; unknown modules are kept as read-only sections and reported in the dry-run (IOX-2).
- **backup:** Not backed up; reproducible from the repository at the release tag.
- **migration rollback:** Registry version field is 1; new optional fields are additive and ignored by older readers. Rollback redeploys the previous build whose registry matches its modules.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-123-09.T15 | integration | PS-123-10.R01, PS-123-10.R02, PS-123-10.R03 | export, import and release rollback | registry not part of any export; older release regenerates its own registry; no data migration |

## Dependencies

Module depends on: CTR-FLG-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
