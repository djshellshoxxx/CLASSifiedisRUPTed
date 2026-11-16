# PS-009-10 — Import, export, backup and rollback: Listing variants

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S03.M02 Listing variants](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/inventory/variants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-009-10.R01** The user export contains all Variant rows of own listings.
- **PS-009-10.R02** Import validates the 50-variant limit, attribute uniqueness and currency match, and rejects violating rows in the dry-run report.
- **PS-009-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section bazaar.variants in classrup-export/v1, one line per Variant (schema classrup.bazaar.variant/v1); quantities travel in the inventory section.
- **import:** Rows import only for listings present in the import or vault; quantities imported from the inventory section; duplicates and over-limit rows are rejected.
- **backup:** Vault export is the primary backup (IOX-6); no relay holds variants other than inside public projections.
- **migration rollback:** Additive optional fields only in v1; rollback is by reinstalling the previous release; older readers ignore new fields.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-009-09.T15 | integration | PS-009-10.R01, PS-009-10.R02, PS-009-10.R03 | export, import to fresh vault, import duplicate attributes | round-trip identical; duplicate rejected in dry-run |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F01.S01.M02, F01.S02.M01, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
