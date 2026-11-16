# PS-003-10 — Import, export, backup and rollback: Listing editing

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M02 Listing editing](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/edit` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-003-10.R01** The user export contains all ListingRevision rows of own listings.
- **PS-003-10.R02** Import verifies snapshotHash for every row and that revisionNo values are unique per listing; failing rows are kept as read-only history.
- **PS-003-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section bazaar.listing_revisions in classrup-export/v1, one line per ListingRevision (schema classrup.bazaar.listing_revision/v1).
- **import:** Rows whose listing is not in the import are held until the listing arrives; hash mismatches are quarantined and reported in the dry-run.
- **backup:** Covered by the vault export (IOX-6); no relay copy exists.
- **migration rollback:** Additive fields only in v1; rollback to the previous release is safe because older readers ignore new optional fields.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-003-09.T13 | integration | PS-003-10.R01, PS-003-10.R02, PS-003-10.R03 | export, import to fresh vault, import row with gap in revisionNo | rows round-trip identical; gap import kept read-only with warning |

## Dependencies

Module depends on: F01.S01.M01, F18.S01.M02, F18.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
