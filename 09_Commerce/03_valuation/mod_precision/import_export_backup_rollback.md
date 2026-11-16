# PS-074-10 — Import, export, backup and rollback: Money precision

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M03 Money precision](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/precision` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-074-10.R01** The library has no data to export or import; the canonical Money JSON form is the interchange format used by other modules' export sections.
- **PS-074-10.R02** The package version and golden vector file are versioned together and published with each release.
- **PS-074-10.R03** A rounding behavior change is a breaking major change and requires a new vector set and an ADR.

## Specification

- **export:** No data. Money values are exported by owning modules as { amount: string, currency: string } per CTR-MNY-001 and re-parsed with parseMinor on import.
- **import:** Import of Money values from other modules calls parseMinor and rejects invalid strings with COMMERCE_MONEY_INVALID.
- **backup:** Nothing to back up; source and vectors live in the repository.
- **migration rollback:** Semantic versioning; any change to rounding results is a major version. Rollback is a dependency pin to the previous release because there is no stored state.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-074-09.T15 | unit | PS-074-10.R01, PS-074-10.R02, PS-074-10.R03 | publish vectors file and load it from a fresh checkout and the previous major | vectors load, versions are recorded and backward compatible |

## Dependencies

Module depends on: CTR-MNY-001, CTR-ERR-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
