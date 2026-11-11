# PS-073-10 — Import, export, backup and rollback: Currency registry

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M01 Currency registry](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/currency` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-073-10.R01** The registry is included in the vault export as a configuration section so a restored vault keeps custom assets.
- **PS-073-10.R02** Import validates codes, decimals and chain binding and rejects rows that conflict with existing immutable fields.
- **PS-073-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** ExportSectionPort section commerce.currencies in the vault export classrup-export/v1; one line per CurrencyDef (schema classrup.commerce.currency_def/v1) including descriptorDigest and origin.
- **import:** Rows with a code already present must match decimals, kind and chain binding exactly; otherwise the import fails with COMMERCE_CURRENCY_IMMUTABLE. descriptorDigest is recomputed on import and must equal the exported value.
- **backup:** The vault export is the primary backup (IOX-6); relays keep no per-user registry.
- **migration rollback:** ISO snapshot updates add rows or mark them retired only; no decimals change. descriptorDigest is an additive field backfilled from existing rows; rollback to the previous release is safe because the older snapshot rows remain valid and older readers ignore the new field.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-073-09.T13 | integration | PS-073-10.R01, PS-073-10.R02, PS-073-10.R03 | export and re-import the registry into a fresh vault; roll back one release | rows identical; v1 rows readable by previous release |

## Dependencies

Module depends on: F09.S03.M03, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
