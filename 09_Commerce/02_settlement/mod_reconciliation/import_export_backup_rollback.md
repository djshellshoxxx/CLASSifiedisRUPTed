# PS-072-10 — Import, export, backup and rollback: Settlement reconciliation

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M03 Settlement reconciliation](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/reconciliation` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-072-10.R01** The vault export includes only the latest completed report in the section commerce.reconciliation for reference.
- **PS-072-10.R02** Import never trusts an imported report; it is stored as imported and a fresh run is scheduled.
- **PS-072-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section commerce.reconciliation in classrup-export/v1; one line with the latest completed ReconciliationReport (schema classrup.commerce.reconciliation_report/v1).
- **import:** Imported report is stored with status completed and an imported flag, never merged; a new run is scheduled immediately after import.
- **backup:** Derived data; recomputable from Deals, claims, observations and receipts, so the vault export of those is the backup.
- **migration rollback:** Additive fields only; reports older than 30 days are purged on rollback or upgrade because they are recomputable.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-072-09.T14 | integration | PS-072-10.R01, PS-072-10.R02, PS-072-10.R03 | export, import to a fresh vault, roll back one release | latest report exports; import marks it imported and triggers a fresh run |

## Dependencies

Module depends on: F09.S01.M01, F09.S01.M03, F09.S02.M01, F09.S03.M03, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
