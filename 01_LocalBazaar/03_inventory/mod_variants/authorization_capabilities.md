# PS-009-05 — Authorization and capabilities: Listing variants

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S03.M02 Listing variants](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/inventory/variants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-009-05.R01** Vault policy: only the local principal who owns the listing may add, update, retire or remove variants.
- **PS-009-05.R02** Reads are limited to the owner; other parties see variants only inside signed listing projections.
- **PS-009-05.R03** No relay role participates and no relay policy row is needed.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| bazaar.variant.add | owner | listing.ownerId = local principal; listing status draft, published or unpublished |
| bazaar.variant.update | owner | variant.ownerId = local principal; variant status active or retired |
| bazaar.variant.retire | owner | variant.ownerId = local principal; no active hold or open offer |
| bazaar.variant.read | owner | variant.ownerId = local principal |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-009-09.T07 | abuse | PS-009-05.R01, PS-009-05.R02, PS-009-05.R03 | other principal or UI-less caller attempts commands | FORBIDDEN or NOT_FOUND; no relay call |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F01.S01.M02, F01.S02.M01, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
