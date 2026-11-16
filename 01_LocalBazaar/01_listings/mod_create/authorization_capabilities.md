# PS-002-05 — Authorization and capabilities: Listing creation

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M01 Listing creation](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/create` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-002-05.R01** Vault policy (CAP-8) allows only the unlocked local principal to run create, delete and read capabilities; there is no server role.
- **PS-002-05.R02** apply_status and apply_edit are internal ports callable only by the named sibling modules inside the vault; the UI and relays cannot invoke them.
- **PS-002-05.R03** No relay policy row exists for this module because it never calls a relay.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| bazaar.listing.create | owner | vault unlocked; principal is the listing author |
| bazaar.listing.delete | owner | listing.ownerId = local principal and status draft |
| bazaar.listing.apply_status | system | caller module is F01.S01.M03 or F01.S01.M04; transition allowed by the machine |
| bazaar.listing.apply_edit | system | caller module is F01.S01.M02 or the owner draft autosave; listing status draft, published or unpublished |
| bazaar.listing.read | owner | listing.ownerId = local principal |
| bazaar.listing.read_own | owner | vault unlocked |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-002-09.T06 | integration | PS-002-04.R03, PS-002-05.R01 | query another principal's listing id | NOT_FOUND; list_mine returns only own listings |
| TEST-PS-002-09.T07 | abuse | PS-002-05.R02, PS-002-05.R03 | UI-context dispatch of apply_status and a network spy during create | FORBIDDEN for non-sibling callers; zero network requests |

## Dependencies

Module depends on: F18.S01.M03, F15.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FLG-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
