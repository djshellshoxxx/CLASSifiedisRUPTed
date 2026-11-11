# PS-007-05 — Authorization and capabilities: Wanted listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M02 Wanted listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/wanted` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-007-05.R01** Vault policy: only the local principal who owns the wanted listing may define, fulfil or withdraw the want.
- **PS-007-05.R02** bazaar.want.list_open is callable by the owner and by the local matching module acting for the owner; it returns private fields only inside the vault.
- **PS-007-05.R03** Relay matching uses the signed public projection and never reads this record.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| bazaar.want.define | owner | listing.ownerId = local principal; listing kind wanted; status draft, published or unpublished |
| bazaar.want.close | owner | want.ownerId = local principal; want status draft, open or paused |
| bazaar.want.read | owner | want.ownerId = local principal, or internal caller F02.S02.M04 acting for the owner |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-007-09.T05 | integration | PS-007-04.R03, PS-007-05.R03 | list_open as owner, as matching module and as relay-facing call | private fields for owner and matching module only; minCondition present; relay-facing path sees projection fields only |
| TEST-PS-007-09.T06 | abuse | PS-007-05.R01, PS-007-05.R02 | another principal defines or withdraws | FORBIDDEN or NOT_FOUND |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M02, F18.S01.M03, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
