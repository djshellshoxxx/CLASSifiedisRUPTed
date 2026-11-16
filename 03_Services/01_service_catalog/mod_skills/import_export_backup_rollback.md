# PS-029-10 — Import, export, backup and rollback: Service skills catalog

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S01.M01 Service skills catalog](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_catalog/skills` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-029-10.R01** The vault export (IOX-1, primary backup) contains all the provider's offerings including drafts, withdrawn ones and sync states.
- **PS-029-10.R02** Import validates IDs, schema version, taxonomy codes and currency before accepting a record.
- **PS-029-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section services.offerings in classrup-export/v1; one line per ServiceOffering (schema classrup.services.offering/v1).
- **import:** Published offerings import as draft so the provider re-signs and re-publishes after review; unknown skill codes are kept as read-only history with a warning.
- **backup:** The vault export is the primary backup (IOX-6); the PWA warns after 30 days without export. Relays hold only the public projection (IOX-7).
- **migration rollback:** Additive optional fields only in v1; rollback is safe because older readers ignore new fields.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-029-09.T13 | integration | PS-029-10.R01, PS-029-10.R02, PS-029-10.R03 | export, import to a fresh relay, restore from backup | offerings round-trip identical; conflicting IDs rejected |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F18.S01.M03, F09.S03.M01, F06.S02.M01, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
