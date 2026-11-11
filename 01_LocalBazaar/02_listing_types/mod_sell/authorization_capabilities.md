# PS-006-05 — Authorization and capabilities: Sell listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M01 Sell listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/sell` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-006-05.R01** Vault policy: only the local principal who owns the listing may define terms.
- **PS-006-05.R02** Reads of the full record, including minOffer, are limited to the owner and to internal callers acting for the owner; public terms reach others only through signed projections.
- **PS-006-05.R03** No relay role or relay policy row applies to this module.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| bazaar.sell_terms.define | owner | listing.ownerId = local principal; listing kind sell; status draft, published or unpublished |
| bazaar.sell_terms.read | owner | listing.ownerId = local principal, or internal caller F01.S04.M01, F01.S04.M02 or F01.S01.M03 on the owner's behalf |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-006-09.T06 | abuse | PS-006-05.R01, PS-006-05.R02, PS-006-05.R03 | other principal calls define; internal caller reads minOffer | FORBIDDEN or NOT_FOUND; offers module allowed on owner's behalf |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M02, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
