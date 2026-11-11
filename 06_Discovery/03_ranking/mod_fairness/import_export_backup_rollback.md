# PS-050-10 — Import, export, backup and rollback: Ranking fairness

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S03.M02 Ranking fairness](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/ranking/fairness` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-050-10.R01** The library owns no data; nothing is exported, imported or backed up.
- **PS-050-10.R02** Changing a constant (page cap, promoted share, slot count) is a breaking behavioral change and needs a new decision record and a version bump of the library.
- **PS-050-10.R03** Rollback is redeploying the previous release; no data migration exists.

## Specification

- **export:** Not applicable; no data is owned.
- **import:** Not applicable; no data is owned.
- **backup:** Not applicable; no data is owned.
- **migration rollback:** Constants are versioned in code with a golden test; rollback is redeploying the previous release.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-050-09.T13 | unit | PS-050-10.R01, PS-050-10.R02, PS-050-10.R03 | check package exports persistence | none; constants version file hashed in the golden test |

## Dependencies

Module depends on: F06.S03.M01, F06.S02.M01, CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-UX-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
