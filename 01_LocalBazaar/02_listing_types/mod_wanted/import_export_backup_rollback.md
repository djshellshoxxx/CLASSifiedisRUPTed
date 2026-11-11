# PS-007-10 — Import, export, backup and rollback: Wanted listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M02 Wanted listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/wanted` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-007-10.R01** The user export contains all WantSpec rows of own wanted listings in section bazaar.wants.
- **PS-007-10.R02** Import imports open wants as paused so the owner must republish; it validates category, currency and ownership.
- **PS-007-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section bazaar.wants in classrup-export/v1, one line per WantSpec (schema classrup.bazaar.want_spec/v1) including private budget because the export goes to the owner only.
- **import:** Wants import as paused regardless of exported status unless fulfilled or withdrawn; unknown categories keep the record read-only with a warning; records with the earlier conditionsAccepted list import with minCondition = the worst listed condition.
- **backup:** Vault export is the primary backup (IOX-6); relays hold only the public projection.
- **migration rollback:** Expand/contract: minCondition is added and conditionsAccepted is still read for 180 days; rollback is by reinstalling the previous release; older readers ignore new fields.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-007-09.T14 | integration | PS-007-10.R01, PS-007-10.R02, PS-007-10.R03 | export, import into fresh vault, import want for foreign listing | round-trip identical; foreign want rejected; open imports as paused |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M02, F18.S01.M03, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
