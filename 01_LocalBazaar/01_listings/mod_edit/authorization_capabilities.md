# PS-003-05 — Authorization and capabilities: Listing editing

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M02 Listing editing](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/edit` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-003-05.R01** Vault policy: only the local principal who authored the listing may edit it; no role or relay can edit.
- **PS-003-05.R02** record is an internal port callable only by F01.S02.M01, F01.S02.M02 and F01.S03.M02 inside the vault.
- **PS-003-05.R03** Revision history is readable only by the owner; other parties get material-change information through the signed projection they receive.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| bazaar.listing.edit | owner | listing.ownerId = local principal; status draft, published or unpublished |
| bazaar.listing_revision.record | system | caller is F01.S02.M01, F01.S02.M02 or F01.S03.M02; same transaction as the caller's own write |
| bazaar.listing_revision.read | owner | listing.ownerId = local principal |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-003-09.T06 | integration | PS-003-04.R02, PS-003-05.R02 | call record from a non-sibling caller and from sell terms | FORBIDDEN for the first; revision and event for the second in one transaction |
| TEST-PS-003-09.T07 | abuse | PS-003-05.R01, PS-003-05.R03 | edit or read history as a different principal in a shared device profile | NOT_FOUND or FORBIDDEN; nothing changes |

## Dependencies

Module depends on: F01.S01.M01, F18.S01.M02, F18.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
