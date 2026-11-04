# PS-047-10 — Import, export, backup and rollback: Coarse location regions

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M01 Coarse location regions](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/coarse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-047-10.R01** The library owns no data, so there is nothing to export, import or back up.
- **PS-047-10.R02** Cell strings stored by other modules remain valid across versions because the geohash algorithm is fixed by standard.
- **PS-047-10.R03** Changes to bucket thresholds or radius sets are breaking and require a new major version of this library and a decision record.

## Specification

- **export:** Not applicable; no data is owned.
- **import:** Not applicable; callers validate imported cells with assertPublicCell.
- **backup:** Not applicable; no data is owned.
- **migration rollback:** Geohash encoding is fixed; the bucket thresholds (5, 10, 25, 50 km) and radius set are versioned constants and rollback is redeploying the previous release.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-047-09.T14 | unit | PS-047-10.R01, PS-047-10.R02, PS-047-10.R03 | check that the package exports no persistence | no export section; vectors compatible across library versions |

## Dependencies

Module depends on: CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
