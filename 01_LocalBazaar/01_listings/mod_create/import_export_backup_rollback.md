# PS-002-10 — Import, export, backup and rollback: Listing creation

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M01 Listing creation](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/create` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-002-10.R01** The user export contains every own Listing in section bazaar.listings of classrup-export/v1.
- **PS-002-10.R02** Import validates schema version, id collisions and ownerId; foreign-owned records are never made editable.
- **PS-002-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section bazaar.listings in classrup-export/v1, one JSON line per Listing (schema classrup.bazaar.listing_record/v1); drafts are included because the export is P3 and goes only to the user.
- **import:** Skip identical ids, reject conflicting ids with a dry-run report; listings whose ownerId differs from the importing principal are stored as read-only history.
- **backup:** The vault export is the primary backup (IOX-6); the app warns when the last export is older than 30 days; no relay holds drafts.
- **migration rollback:** Additive optional fields only within v1; older app builds ignore unknown optional fields; rollback is by reinstalling the previous release and re-importing the last export. Records written under the earlier name classrup.bazaar.listing/v1 are read as classrup.bazaar.listing_record/v1 for 180 days, and their earlier mediaRefs string list is read as media entries with ref only (no alt, decorative absent) so the owner is asked for descriptions before publishing.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-002-09.T14 | integration | PS-002-10.R01, PS-002-10.R02, PS-002-10.R03 | export, import into a fresh vault, then import a record with foreign ownerId | owned listings round-trip identical; foreign record kept read-only |

## Dependencies

Module depends on: F18.S01.M03, F15.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F10.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FLG-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
